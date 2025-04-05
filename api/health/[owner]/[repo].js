import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Octokit with GitHub token
const getOctokit = (req) => {
  const token = req.query.token || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GitHub token is missing");
  }
  return new Octokit({
    auth: token
  });
};

// Calculate overall health score function
function calculateHealthScore(metrics) {
  const weights = {
    issuesResponseTime: 0.15,
    prMergeTime: 0.15,
    commitFrequency: 0.2,
    contributorCount: 0.1,
    issueCloseRate: 0.15,
    codebaseGrowth: 0.1,
    documentationScore: 0.15
  };

  let score = 0;
  for (const [key, value] of Object.entries(metrics)) {
    if (value.score !== undefined) {
      score += value.score * weights[key];
    }
  }

  return Math.round(score * 100) / 100;
}

// Helper function to calculate issue response time
function calculateIssueResponseTime(openIssues, closedIssues) {
  const allIssues = [...openIssues, ...closedIssues].filter(issue => !('pull_request' in issue));

  if (allIssues.length === 0) {
    return { score: 0, value: 'N/A', description: 'No issues found' };
  }

  // Calculate average time to first response
  const now = new Date();
  let totalDays = 0;
  let issuesWithComments = 0;

  allIssues.forEach(issue => {
    if (issue.comments > 0) {
      const createdDate = new Date(issue.created_at);
      const resolvedDate = issue.closed_at ? new Date(issue.closed_at) : now;
      const daysDiff = (resolvedDate - createdDate) / (1000 * 60 * 60 * 24);
      totalDays += daysDiff;
      issuesWithComments++;
    }
  });

  const avgResponseDays = issuesWithComments > 0 ? totalDays / issuesWithComments : 0;

  // Score calculation
  let score;
  if (avgResponseDays <= 1) {
    score = 1; // Same day or next day response: excellent
  } else if (avgResponseDays <= 3) {
    score = 0.8; // 2-3 days: very good
  } else if (avgResponseDays <= 7) {
    score = 0.6; // 4-7 days: good
  } else if (avgResponseDays <= 14) {
    score = 0.4; // 8-14 days: fair
  } else if (avgResponseDays <= 30) {
    score = 0.2; // 15-30 days: poor
  } else {
    score = 0; // > 30 days: very poor
  }

  return {
    score,
    value: avgResponseDays.toFixed(1) + ' days',
    description: `Average time to respond to issues: ${avgResponseDays.toFixed(1)} days`
  };
}

// Helper function to calculate PR merge time
async function calculatePRMergeTime(owner, repo, octokit) {
  try {
    // Get recent merged PRs
    const prs = await octokit.pulls.list({
      owner,
      repo,
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
      per_page: 30
    });

    const mergedPRs = prs.data.filter(pr => pr.merged_at);

    if (mergedPRs.length === 0) {
      return { score: 0, value: 'N/A', description: 'No merged PRs found' };
    }

    let totalDays = 0;
    mergedPRs.forEach(pr => {
      const createdDate = new Date(pr.created_at);
      const mergedDate = new Date(pr.merged_at);
      const daysDiff = (mergedDate - createdDate) / (1000 * 60 * 60 * 24);
      totalDays += daysDiff;
    });

    const avgMergeDays = totalDays / mergedPRs.length;

    // Score calculation: faster is better (inverse relationship)
    let score;
    if (avgMergeDays <= 1) {
      score = 1; // Same day merge: excellent
    } else if (avgMergeDays <= 3) {
      score = 0.8; // 2-3 days: very good
    } else if (avgMergeDays <= 7) {
      score = 0.6; // 4-7 days: good
    } else if (avgMergeDays <= 14) {
      score = 0.4; // 8-14 days: fair
    } else if (avgMergeDays <= 30) {
      score = 0.2; // 15-30 days: poor
    } else {
      score = 0; // > 30 days: very poor
    }

    return {
      score,
      value: avgMergeDays.toFixed(1) + ' days',
      description: `Average time to merge PRs: ${avgMergeDays.toFixed(1)} days`
    };
  } catch (error) {
    console.error('Error calculating PR merge time:', error);
    return { score: 0, value: 'Error', description: 'Failed to calculate PR merge time' };
  }
}

// Helper function to calculate commit frequency
function calculateCommitFrequency(commitActivity) {
  if (!Array.isArray(commitActivity) || commitActivity.length === 0) {
    return { score: 0, value: 'N/A', description: 'No commit activity data available' };
  }

  // Calculate average weekly commits over the last year
  const totalCommits = commitActivity.reduce((sum, week) => sum + week.total, 0);
  const avgWeeklyCommits = totalCommits / commitActivity.length;

  // Score calculation
  let score;
  if (avgWeeklyCommits >= 20) {
    score = 1; // Very active: 20+ commits per week
  } else if (avgWeeklyCommits >= 10) {
    score = 0.8; // Active: 10-19 commits per week
  } else if (avgWeeklyCommits >= 5) {
    score = 0.6; // Moderately active: 5-9 commits per week
  } else if (avgWeeklyCommits >= 1) {
    score = 0.4; // Low activity: 1-4 commits per week
  } else if (avgWeeklyCommits > 0) {
    score = 0.2; // Very low activity: less than 1 commit per week
  } else {
    score = 0; // No activity
  }

  return {
    score,
    value: avgWeeklyCommits.toFixed(1) + ' commits/week',
    description: `Average weekly commits: ${avgWeeklyCommits.toFixed(1)}`
  };
}

// Helper function to calculate contributor activity
function calculateContributorActivity(contributors) {
  if (!Array.isArray(contributors) || contributors.length === 0) {
    return { score: 0, value: 'N/A', description: 'No contributor data available' };
  }

  const contributorCount = contributors.length;

  // Calculate active contributors (with commits in the last 3 months)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const activeContributors = contributors.filter(contributor => {
    if (!contributor.weeks || contributor.weeks.length === 0) return false;

    // Check if there are commits in the last 3 months
    return contributor.weeks.some(week => {
      const weekDate = new Date(week.w * 1000); // Unix timestamp to date
      return weekDate >= threeMonthsAgo && week.c > 0;
    });
  }).length;

  // Score calculation
  let score;
  if (contributorCount >= 20 && activeContributors >= 10) {
    score = 1; // Large and active community
  } else if (contributorCount >= 10 && activeContributors >= 5) {
    score = 0.8; // Medium-sized active community
  } else if (contributorCount >= 5 && activeContributors >= 3) {
    score = 0.6; // Small but active community
  } else if (contributorCount >= 3 && activeContributors >= 1) {
    score = 0.4; // Very small community
  } else if (contributorCount > 1) {
    score = 0.2; // Minimal community
  } else {
    score = 0; // Single contributor
  }

  return {
    score,
    value: `${activeContributors}/${contributorCount} active`,
    description: `${activeContributors} active out of ${contributorCount} total contributors`
  };
}

// Helper function to calculate issue close rate
function calculateIssueCloseRate(openIssues, closedIssues) {
  if (!openIssues || openIssues.length === 0 || !closedIssues || closedIssues.length === 0) {
    return { score: 0, value: 'N/A', description: 'No issues data available' };
  }

  const totalIssues = openIssues.length + closedIssues.length;
  const closedIssueCount = closedIssues.length;

  if (totalIssues === 0) {
    return { score: 0, value: 'N/A', description: 'No issues data available' };
  }

  const closeRate = closedIssueCount / totalIssues;

  // Score calculation
  let score;
  if (closeRate >= 0.9) {
    score = 1; // Excellent close rate
  } else if (closeRate >= 0.7) {
    score = 0.8; // Very good close rate
  } else if (closeRate >= 0.5) {
    score = 0.6; // Good close rate
  } else if (closeRate >= 0.3) {
    score = 0.4; // Fair close rate
  } else {
    score = 0.2; // Poor close rate
  }

  return {
    score,
    value: (closeRate * 100).toFixed(1) + '%',
    description: `Issue close rate: ${(closeRate * 100).toFixed(1)}%`
  };
}

// Helper function to calculate codebase growth
function calculateCodebaseGrowth(commitActivity) {
  if (!commitActivity || commitActivity.length === 0) {
    return { score: 0, value: 'N/A', description: 'No commit activity data available' };
  }

  // Assuming that codebase growth can be inferred from the number of commits
  // We'll calculate the total number of commits over a period
  const totalCommits = commitActivity.reduce((sum, week) => sum + week.total, 0);

  // Score calculation (higher number of commits could indicate more growth)
  let score;
  if (totalCommits >= 100) {
    score = 1; // Excellent growth (100+ commits)
  } else if (totalCommits >= 50) {
    score = 0.8; // Very good growth (50-99 commits)
  } else if (totalCommits >= 20) {
    score = 0.6; // Good growth (20-49 commits)
  } else if (totalCommits >= 10) {
    score = 0.4; // Fair growth (10-19 commits)
  } else if (totalCommits > 0) {
    score = 0.2; // Low growth (1-9 commits)
  } else {
    score = 0; // No growth
  }

  return {
    score,
    value: totalCommits + ' commits',
    description: `Total commits: ${totalCommits}`
  };
}

// Helper function to calculate documentation score
async function calculateDocumentationScore(owner, repo, octokit) {
  try {
    // Fetch the repository contents (list of files)
    const contents = await octokit.repos.getContent({
      owner,
      repo,
      path: ''
    });

    // Check if README.md exists in the repository
    const readme = contents.data.find(file => 
      file.name.toLowerCase() === 'readme.md' || 
      file.name.toLowerCase() === 'readme.markdown' ||
      file.name.toLowerCase() === 'readme'
    );

    if (readme) {
      return {
        score: 1,
        value: 'README found',
        description: 'The repository has a README file.'
      };
    } else {
      return {
        score: 0.5,
        value: 'No README found',
        description: 'The repository does not have a README file.'
      };
    }
  } catch (error) {
    console.error('Error calculating documentation score:', error);
    return {
      score: 0,
      value: 'Error',
      description: 'Failed to calculate documentation score'
    };
  }
}

// Get contributors using the correct API endpoint
async function fetchContributors(owner, repo, octokit) {
  try {
    // Fetch contributor data from the GitHub API
    const response = await octokit.repos.getContributorsStats({ owner, repo });
    
    // GitHub may respond with 202 if the data is being calculated
    if (response.status === 202) {
      // Wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchContributors(owner, repo, octokit);
    }

    if (!response.data || response.data.length === 0) {
      console.log("No contributors found.");
      return [];
    }

    // Return the contributors' data
    return response.data;
  } catch (error) {
    console.error('Error fetching contributors:', error);
    return [];
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { owner, repo } = req.query;
    
    if (!owner || !repo) {
      return res.status(400).json({ error: 'Owner and repo parameters are required' });
    }

    const octokit = getOctokit(req);

    // Get basic repo info
    const repoInfo = await octokit.repos.get({
      owner,
      repo
    });

    // Get commit activity for the last year
    const commitActivityResponse = await octokit.repos.getCommitActivityStats({
      owner,
      repo
    });
    
    let commitActivity = commitActivityResponse.data;
    
    // If GitHub returns 202, the data is still being generated
    if (commitActivityResponse.status === 202) {
      commitActivity = [];
    }
    
    if (!Array.isArray(commitActivity)) {
      commitActivity = [];
    }

    // Get contributor stats
    const contributors = await fetchContributors(owner, repo, octokit);

    // Get open issues
    const openIssues = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      per_page: 100
    });

    // Get closed issues (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const closedIssues = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'closed',
      since: thirtyDaysAgo.toISOString(),
      per_page: 100
    });

    // Calculate metrics
    const metrics = {
      issuesResponseTime: calculateIssueResponseTime(openIssues.data, closedIssues.data),
      prMergeTime: await calculatePRMergeTime(owner, repo, octokit),
      commitFrequency: calculateCommitFrequency(commitActivity),
      contributorCount: calculateContributorActivity(contributors),
      issueCloseRate: calculateIssueCloseRate(openIssues.data, closedIssues.data),
      codebaseGrowth: calculateCodebaseGrowth(commitActivity),
      documentationScore: await calculateDocumentationScore(owner, repo, octokit)
    };

    // Calculate overall health score
    const healthScore = calculateHealthScore(metrics);

    res.status(200).json({
      repoName: repoInfo.data.name,
      repoOwner: repoInfo.data.owner.login,
      healthScore,
      metrics,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching repository health:', error);
    
    // Handle specific GitHub API errors
    if (error.status === 404) {
      return res.status(404).json({ error: 'Repository not found' });
    }
    
    if (error.status === 403 && error.message.includes('rate limit')) {
      return res.status(429).json({ error: 'GitHub API rate limit exceeded' });
    }
    
    res.status(500).json({ error: 'Failed to analyze repository health', message: error.message });
  }
}
