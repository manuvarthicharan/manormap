$ErrorActionPreference = "Stop"

Write-Host "Building production bundle for MapEstate..." -ForegroundColor Cyan
npm run build

Write-Host "Deploying to GitHub Pages (gh-pages branch)..." -ForegroundColor Cyan
Push-Location "dist"
try {
    New-Item -ItemType File -Name ".nojekyll" -Force | Out-Null
    git init
    git config user.name "Keerthi Charan"
    git config user.email "mkcharan77@gmail.com"
    git checkout -b gh-pages
    git add -A
    git commit -m "Deploy latest build to GitHub Pages"
    
    # Push to mapestate if renamed, or fall back to manormap.git
    try {
        git push https://github.com/manuvarthicharan/mapestate.git gh-pages --force
        Write-Host "Successfully deployed to https://manuvarthicharan.github.io/mapestate/" -ForegroundColor Green
    } catch {
        Write-Host "Pushing to https://github.com/manuvarthicharan/manormap.git..." -ForegroundColor Yellow
        git push https://github.com/manuvarthicharan/manormap.git gh-pages --force
        Write-Host "Successfully deployed to https://manuvarthicharan.github.io/manormap/" -ForegroundColor Green
    }
    Remove-Item -Recurse -Force .git
} finally {
    Pop-Location
}
