import React from 'react';

export const AZSizeCLIGuide = () => {
  return (
    <>
      <h2>Introduction</h2>
      <p>
        The AZSize CLI tool brings powerful Azure VM availability checking directly to your terminal. Whether you're
        writing deployment scripts, automating infrastructure checks, or just prefer command-line workflows, the AZSize
        CLI makes it easy to verify VM availability across all Azure regions.
      </p>

      <h2>Installation</h2>
      <p>
        Install the AZSize CLI globally using npm:
      </p>
      <pre><code>npm install -g azsize</code></pre>
      <p>
        That's it! You're ready to start checking VM availability from your terminal.
      </p>

      <h2>Basic Commands</h2>

      <h3>Check a Specific VM in a Region</h3>
      <p>
        The most common use case is checking if a specific VM size is available in a particular region:
      </p>
      <pre><code>azsize check Standard_D4s_v5 --region eastus</code></pre>
      <p>
        This command will show you:
      </p>
      <ul>
        <li>Whether the VM is available in that region</li>
        <li>Any restrictions (if applicable)</li>
        <li>Historical availability data (if available)</li>
      </ul>

      <h3>Compare Across Multiple Regions</h3>
      <p>
        Need to find the best region for your deployment? Compare availability across multiple regions at once:
      </p>
      <pre><code>azsize compare Standard_D4s_v5 --regions eastus,westus2,centralus</code></pre>
      <p>
        This gives you a side-by-side comparison, making it easy to choose the optimal region.
      </p>

      <h3>Find All Regions Where a VM is Available</h3>
      <p>
        Don't know which regions support your VM? Use the find command to search across all 49 Azure regions:
      </p>
      <pre><code>azsize find Standard_NC6s_v3</code></pre>
      <p>
        This is especially useful for specialized VMs like GPU-enabled instances that aren't available everywhere.
      </p>

      <h2>Authentication & Rate Limits</h2>

      <h3>Anonymous Usage</h3>
      <p>
        You can use AZSize CLI without authentication for quick checks:
      </p>
      <ul>
        <li><strong>Free tier:</strong> 1 check without signup</li>
        <li>Perfect for one-off queries</li>
      </ul>

      <h3>Authenticated Usage</h3>
      <p>
        For regular use, create a free account at <a href="https://www.azsize.com/signup">azsize.com/signup</a> and
        generate an API key from your dashboard. This gives you:
      </p>
      <ul>
        <li><strong>50 checks per month</strong> on the free tier</li>
        <li>Usage tracking across web and CLI</li>
        <li>Historical data access</li>
      </ul>

      <h3>Setting Up Your API Key</h3>
      <p>
        Once you have your API key, authenticate the CLI:
      </p>
      <pre><code>azsize auth azsk_your_api_key_here</code></pre>
      <p>
        Your API key is stored securely in <code>~/.azsize/config.json</code> and will be used automatically for all future commands.
      </p>

      <h3>Check Your Auth Status</h3>
      <p>
        View your current authentication status and usage:
      </p>
      <pre><code>azsize auth</code></pre>

      <h3>Logout</h3>
      <p>
        Remove your stored API key:
      </p>
      <pre><code>azsize auth logout</code></pre>

      <h2>Output Formats</h2>

      <h3>Human-Readable (Default)</h3>
      <p>
        By default, AZSize displays results in a beautiful, color-coded table format perfect for terminal viewing.
      </p>

      <h3>JSON Output</h3>
      <p>
        For scripting and automation, use JSON output:
      </p>
      <pre><code>azsize check Standard_D4s_v5 --region eastus --json</code></pre>
      <p>
        This makes it easy to parse results in your CI/CD pipelines or infrastructure scripts.
      </p>

      <h3>CSV Output</h3>
      <p>
        Export data for spreadsheets and analysis:
      </p>
      <pre><code>azsize compare Standard_D4s_v5 --regions eastus,westus2,centralus --csv</code></pre>

      <h2>Common Use Cases</h2>

      <h3>Pre-Deployment Validation</h3>
      <p>
        Before deploying infrastructure with Terraform or ARM templates, verify that your desired VM sizes are available:
      </p>
      <pre><code>#!/bin/bash
if azsize check Standard_D4s_v5 --region eastus --json | jq -r '.available' | grep -q 'true'; then
  echo "VM available, proceeding with deployment"
  terraform apply
else
  echo "VM not available, trying alternate region"
  terraform apply -var="region=westus2"
fi</code></pre>

      <h3>Multi-Region Deployment Planning</h3>
      <p>
        Find the best regions for deploying your application across multiple geos:
      </p>
      <pre><code>azsize find Standard_D8s_v5 --json | jq -r '.regions[] | select(.available==true) | .name'</code></pre>

      <h3>Cost Optimization Research</h3>
      <p>
        Some regions have better availability for certain VM families. Use AZSize to identify which regions consistently
        have the VMs you need, then compare pricing across those regions.
      </p>

      <h2>Advanced Tips</h2>

      <h3>Combine with Other Tools</h3>
      <p>
        AZSize CLI works great with other command-line tools:
      </p>
      <pre><code># Count available regions for a VM
azsize find Standard_D4s_v5 --json | jq '.regions | length'

# Get only available regions
azsize find Standard_D4s_v5 --json | jq -r '.regions[] | select(.available==true) | .name'</code></pre>

      <h3>Create Aliases</h3>
      <p>
        For frequently-checked VMs, create shell aliases:
      </p>
      <pre><code>alias check-d4="azsize check Standard_D4s_v5"
alias check-gpu="azsize find Standard_NC6s_v3"</code></pre>

      <h3>CI/CD Integration</h3>
      <p>
        Add VM availability checks to your CI/CD pipeline:
      </p>
      <pre><code># GitHub Actions example
- name: Check VM Availability
  run: |
    npm install -g azsize
    azsize auth ${'{{ secrets.AZSIZE_API_KEY }}'}
    azsize check Standard_D4s_v5 --region eastus --json</code></pre>

      <h2>Troubleshooting</h2>

      <h3>Rate Limit Exceeded</h3>
      <p>
        If you see a rate limit error, either authenticate with an API key or wait until your limit resets at the
        beginning of the next month.
      </p>

      <h3>Connection Issues</h3>
      <p>
        The CLI requires internet access to query Azure's availability data. Check your network connection if you
        encounter timeout errors.
      </p>

      <h2>Getting Help</h2>
      <p>
        View all available commands:
      </p>
      <pre><code>azsize --help</code></pre>
      <p>
        Get help for a specific command:
      </p>
      <pre><code>azsize check --help</code></pre>

      <h2>Conclusion</h2>
      <p>
        The AZSize CLI brings powerful Azure VM availability checking to your terminal, perfect for automation,
        scripting, and quick queries. Whether you're a DevOps engineer, cloud architect, or developer, it's a
        valuable addition to your Azure toolkit.
      </p>
      <p>
        Ready to get started? Install the CLI and <a href="/signup">create a free account</a> to unlock 50 checks per month!
      </p>
    </>
  );
};

export const azsizeCLIGuideMetadata = {
  slug: 'azsize-cli-guide',
  title: 'AZSize CLI Guide: Check Azure VM Availability from Your Terminal',
  excerpt: 'Learn how to use the AZSize CLI tool to check Azure VM availability, authenticate with API keys, and integrate with your DevOps workflows.',
  date: 'December 22, 2024',
  readTime: '10 min read',
  tags: ['CLI', 'DevOps', 'Azure', 'Automation'],
  component: AZSizeCLIGuide
};
