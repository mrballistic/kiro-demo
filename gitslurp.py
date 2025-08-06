#!/usr/bin/env python3
import subprocess
import json
import sys
from datetime import datetime

class GitAnalyzer:
    def __init__(self, repo_path):
        self.repo_path = repo_path
    
    def run_git_command(self, command):
        """Execute a git command and return the output"""
        try:
            result = subprocess.run(
                command,
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            print(f"Git command failed: {e}")
            print(f"Error output: {e.stderr}")
            return None
    
    def get_repository_name(self):
        """Get the repository name from the remote URL or directory name"""
        # Try to get from remote URL first
        command = ['git', 'config', '--get', 'remote.origin.url']
        remote_url = self.run_git_command(command)
        
        if remote_url:
            # Extract repo name from URL (works for both HTTPS and SSH)
            repo_name = remote_url.split('/')[-1]
            if repo_name.endswith('.git'):
                repo_name = repo_name[:-4]
            return repo_name
        
        # Fallback to directory name
        import os
        return os.path.basename(os.path.dirname(self.repo_path))
    
    def get_commit_details(self, commit_hash):
        """Get detailed stats for a specific commit including lines added/removed"""
        # Get the numstat for accurate line counts
        command = ['git', 'show', '--numstat', '--format=', commit_hash]
        output = self.run_git_command(command)
        
        if not output:
            return {'linesAdded': 0, 'linesRemoved': 0, 'filesModified': []}
        
        lines_added = 0
        lines_removed = 0
        files_modified = []
        
        for line in output.strip().split('\n'):
            if line:
                parts = line.split('\t')
                if len(parts) >= 3:
                    # numstat format: added\tremoved\tfilename
                    try:
                        added = int(parts[0]) if parts[0] != '-' else 0
                        removed = int(parts[1]) if parts[1] != '-' else 0
                        filename = parts[2]
                        
                        lines_added += added
                        lines_removed += removed
                        files_modified.append(filename)
                    except ValueError:
                        continue
        
        return {
            'linesAdded': lines_added,
            'linesRemoved': lines_removed,
            'filesModified': files_modified
        }
    
    def format_timestamp(self, unix_timestamp):
        """Convert Unix timestamp to ISO 8601 format with Z suffix"""
        dt = datetime.utcfromtimestamp(int(unix_timestamp))
        return dt.strftime('%Y-%m-%dT%H:%M:%SZ')
    
    def get_commits(self, limit=100):
        """Get commit history in the specified format"""
        # Format: hash|author_name|author_email|timestamp
        format_string = '%H|%an|%ae|%at'
        command = ['git', 'log', f'--format={format_string}', f'-n{limit}']
        
        output = self.run_git_command(command)
        if not output:
            return []
        
        commits = []
        commit_lines = output.split('\n')
        
        print(f"Processing {len(commit_lines)} commits...")
        
        for i, line in enumerate(commit_lines):
            if line:
                parts = line.split('|')
                if len(parts) >= 4:
                    commit_hash = parts[0]
                    
                    # Get detailed stats for this commit
                    details = self.get_commit_details(commit_hash)
                    
                    commit = {
                        'hash': commit_hash,
                        'author': parts[1],
                        'email': parts[2],
                        'timestamp': self.format_timestamp(parts[3]),
                        'linesAdded': details['linesAdded'],
                        'linesRemoved': details['linesRemoved'],
                        'filesModified': details['filesModified']
                    }
                    
                    commits.append(commit)
                    
                    # Progress indicator
                    if (i + 1) % 10 == 0:
                        print(f"  Processed {i + 1}/{len(commit_lines)} commits...")
        
        return commits
    
    def analyze_repository(self, commit_limit=100):
        """Analyze repository and return data in the specified format"""
        print("Analyzing repository...")
        
        # Get repository name
        repo_name = self.get_repository_name()
        print(f"Repository: {repo_name}")
        
        # Get commits with full details
        commits = self.get_commits(limit=commit_limit)
        
        return {
            'repository': repo_name,
            'commits': commits
        }

def save_to_json(data, filename='git_analysis.json'):
    """Save analysis results to JSON file"""
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"\nAnalysis saved to {filename}")

def send_to_api(data, endpoint):
    """Send data to your React app's API endpoint"""
    import urllib.request
    import urllib.error
    
    json_data = json.dumps(data).encode('utf-8')
    
    req = urllib.request.Request(
        endpoint,
        data=json_data,
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = response.read().decode('utf-8')
            print(f"Successfully sent data to {endpoint}")
            return result
    except urllib.error.URLError as e:
        print(f"Failed to send data: {e}")
        return None

# Main execution
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python git_analyzer.py <path_to_git_repo> [--limit=50] [--api=http://localhost:3000/api/git-data]")
        sys.exit(1)
    
    repo_path = sys.argv[1]
    commit_limit = 100
    api_endpoint = None
    
    # Parse optional arguments
    for arg in sys.argv[2:]:
        if arg.startswith('--limit='):
            commit_limit = int(arg.split('=')[1])
        elif arg.startswith('--api='):
            api_endpoint = arg.split('=')[1]
    
    # Analyze repository
    analyzer = GitAnalyzer(repo_path)
    results = analyzer.analyze_repository(commit_limit=commit_limit)
    
    # Save to file
    save_to_json(results)
    
    # Send to API if endpoint provided
    if api_endpoint:
        send_to_api(results, api_endpoint)
    
    # Print summary
    print("\nAnalysis Summary:")
    print(f"Repository: {results['repository']}")
    print(f"Total Commits Analyzed: {len(results['commits'])}")
    
    if results['commits']:
        total_added = sum(c['linesAdded'] for c in results['commits'])
        total_removed = sum(c['linesRemoved'] for c in results['commits'])
        print(f"Total Lines Added: {total_added:,}")
        print(f"Total Lines Removed: {total_removed:,}")
        
        # Top contributors
        authors = {}
        for commit in results['commits']:
            author = commit['author']
            if author not in authors:
                authors[author] = 0
            authors[author] += 1
        
        print("\nTop Contributors:")
        for author, count in sorted(authors.items(), key=lambda x: x[1], reverse=True)[:5]:
            print(f"  {author}: {count} commits")