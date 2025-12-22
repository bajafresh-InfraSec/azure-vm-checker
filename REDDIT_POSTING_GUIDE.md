# Reddit Posting Strategy for AZSize

## Important Rules

1. **Don't spam** - Reddit communities hate promotional content
2. **Provide value first** - Share knowledge, then mention your tool
3. **Be authentic** - Participate in discussions genuinely
4. **Follow subreddit rules** - Read rules before posting
5. **Timing matters** - Post during US business hours (9 AM - 2 PM EST)

## Target Subreddits

### r/AZURE (Primary Target)
- **Members:** 200k+
- **Focus:** Azure cloud platform
- **Best approach:** Share blog posts as helpful guides
- **Allowed:** Tools that help Azure users

### r/devops
- **Members:** 300k+
- **Focus:** DevOps practices and tools
- **Best approach:** CLI tool showcase, automation tips
- **Allowed:** Open-source tools, productivity enhancers

### r/sysadmin
- **Members:** 500k+
- **Focus:** System administration
- **Best approach:** Solve common problems, share solutions
- **Allowed:** Helpful tools for infrastructure management

### r/selfhosted (Secondary)
- **Members:** 400k+
- **Focus:** Self-hosted services
- **Best approach:** Share as a useful utility
- **Note:** Less relevant but tech-savvy audience

## Posting Templates

### Template 1: Educational Post (Best for r/AZURE)

**Title:** "Understanding Azure VM Availability: Common Issues and Solutions"

**Body:**
```
I've been working with Azure VMs for a while and kept running into availability issues - VMs not available in certain regions, quota limits, capacity constraints, etc.

After dealing with this enough times, I wrote a comprehensive guide covering:

- Why VMs aren't available in all regions
- Common availability scenarios (quota, capacity, restrictions)
- Best practices for deployment planning
- Quick reference for VM series by use case

[Link to blog post: https://www.azsize.com/blog/azure-vm-availability-guide]

I also built a quick tool (azsize.com) to check availability across all 49 regions at once, since manually checking with Azure CLI was tedious. It's free to use if anyone finds it helpful.

Happy to answer questions about Azure VM availability!
```

### Template 2: Tool Showcase (Best for r/devops)

**Title:** "Built a CLI tool to check Azure VM availability across all regions"

**Body:**
```
I got tired of running `az vm list-skus` multiple times to find which regions had the VMs I needed, so I built a simple CLI tool:

```bash
npm install -g azsize
azsize check Standard_D4s_v5 --region eastus
azsize find Standard_NC6s_v3  # searches all 49 regions
```

Features:
- Search all Azure regions in seconds
- Compare availability across multiple regions
- JSON/CSV output for automation
- Free tier: 50 checks/month
- Web UI also available at azsize.com

Perfect for:
- Pre-deployment validation
- Terraform/ARM template planning
- CI/CD pipeline checks
- Finding GPU VM availability

Wrote a guide on using it for DevOps workflows: [link]

GitHub: [would add if open-source]
Website: https://www.azsize.com

Open to feedback!
```

### Template 3: Problem-Solution (Best for r/sysadmin)

**Title:** "Tired of Azure VMs being unavailable in your region? Here's how to find them fast"

**Body:**
```
**The Problem:**
You're trying to deploy VMs in Azure and get "SkuNotAvailable" errors. You try another region. Same thing. You spend an hour running CLI commands to find where your VM is actually available.

**The Solution:**
I built a quick checker that searches all 49 Azure regions at once: azsize.com

You can search for any VM size (Standard_D4s_v5, Standard_NC6s_v3, etc.) and instantly see:
- Which regions have it available
- Any restrictions
- Historical availability

Also has a CLI tool for automation:
```bash
npm install -g azsize
azsize find Standard_D4s_v5
```

Free tier gives you 50 checks/month, which is plenty for most use cases.

Hope this saves someone else the frustration I went through!
```

## Posting Strategy

### Week 1: Educational Content
- Day 1: Post blog guide on r/AZURE
- Day 3: Answer questions and engage
- Day 5: Share CLI guide on r/devops

### Week 2: Tool Promotion
- Day 1: Tool showcase on r/devops
- Day 4: Problem-solution on r/sysadmin

### Week 3: Community Engagement
- Answer questions about Azure VM availability in existing threads
- Mention tool when relevant and helpful
- Build karma and reputation

## Best Practices

### DO:
✓ Provide value first, promote second
✓ Respond to all comments promptly
✓ Be honest about limitations
✓ Thank people for feedback
✓ Engage in other discussions in the subreddit
✓ Use proper markdown formatting
✓ Include code examples where helpful

### DON'T:
✗ Post same content to multiple subreddits on same day
✗ Delete posts if they don't get upvotes
✗ Argue with critics
✗ Ignore questions/feedback
✗ Make claims you can't back up
✗ Ask for upvotes
✗ Self-promote in comments of other posts

## Tracking Results

Monitor:
- Upvotes and comments
- Website traffic from reddit.com (Google Analytics)
- Signup conversions from Reddit
- Keyword mentions in discussions

## Example Real Reddit Posts (For Inspiration)

Search Reddit for:
- "azure vm availability"
- "SkuNotAvailable azure"
- "azure vm quota"

Find real questions people are asking and provide helpful answers with a link to your tool.

## Emergency Response

If someone criticizes your tool:
1. Thank them for feedback
2. Ask for specific issues
3. Fix legitimate problems
4. Update the post with improvements

If post gets removed:
1. Read removal reason
2. Message mods politely if unclear
3. Don't repost without mod approval
4. Adjust approach for next subreddit

## Measuring Success

A successful post should:
- Get 50+ upvotes
- Generate 10+ meaningful comments
- Drive 500+ website visits
- Result in 10+ signups

Don't expect overnight success. Building Reddit reputation takes time.
