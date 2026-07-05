# GitHub Pages Deployment

1. Download and unzip the release.
2. Upload the contents of the unzipped folder to the repository root.
3. Make sure the root contains:

```text
index.html
README.md
assets/
docs/
```

4. Go to:

```text
Settings → Pages
```

5. Use:

```text
Deploy from branch
main
/root
```

6. Wait for GitHub Pages to finish deployment.
7. Open the live site.
8. Hard-refresh with:

```text
Ctrl+F5
```

## Troubleshooting

If the page does not update, append a cache buster:

```text
?version=1
```

Example:

```text
https://zantimertacticus.github.io/Tacticus-Damage-Calculator/?version=1
```
