# GitHub MCP Integration

This repository is configured to be used with the GitHub MCP Server for AI-assisted operations (issues, PRs, actions logs, repo content).

## Prerequisites
- GitHub account with access to this repo
- VS Code with Copilot Chat or any MCP-capable client
- Org policy enabling "MCP servers in Copilot" if using Copilot Business/Enterprise

## Setup (Hosted Server)
1. Open your MCP-capable client settings
2. Add the GitHub MCP server per the official guide
3. Enable the following toolsets:
   - `repos`, `pull_requests`, `issues`, `actions`
4. Recommended tools:
   - `actions_get`, `get_file_contents`, `create_pull_request`, `issue_read`, `issue_create`

## Usage Examples
- "List failed workflow runs for Deploy and summarize the errors"
- "Create a PR updating dependencies and reference CI results"
- "Open an issue for documentation gaps found in README and link sections"

## Local (Docker) Option
```bash
docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=<token> \
  -e GITHUB_TOOLSETS="repos,issues,pull_requests,actions" \
  ghcr.io/github/github-mcp-server
```

## Notes
- No secrets are stored in repo; configure tokens in your client.
- MCP is for interactive AI tooling; CI/CD remains source of truth for deployments.
