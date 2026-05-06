@echo off
echo # testingarea >> README.md
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/macapagaljoshua123/testingarea.git
git push -u origin main
