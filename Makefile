deploy-205:
	rsync -avhzL --delete \
				--no-perms --no-owner --no-group \
				--exclude .git \
				--filter=":- .gitignore" \
				. sotatek@192.168.1.205:/Data/walletmessenger