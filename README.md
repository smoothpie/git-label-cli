# git-label-cli

Create and remove labels across GitHub repositories

## Installation

`npm install -g git-label-cli`

## Examples:

`git-label -- opuscapita/git-label-cli`
`git-label --repositories-json`

**repositories.json** example:

```json
[
  "github_user/repo-1",
  "github_user/repo-2",
  "github_user/repo-3"
]
```

**labels-to-create.json** example:

```json
[
  { "name": "closed: completed", "color": "#d93f0b" },
  { "name": "closed: duplicate", "color": "#d93f0b" },
  { "name": "closed: wontfix", "color": "#d93f0b" },
  { "name": "requested by: myFavoriteCustomer", "color": "#0052cc" },
  { "name": "type: bug", "color": "#1d76db" },
  { "name": "type: enhancement", "color": "#1d76db" }
]
```

**labels-to-remove.json** example:

```json
[
  { "name": "bug" },
  { "name": "enhancement" },
  { "name": "duplicate" },
  { "name": "good first issue" },
  { "name": "help wanted" },
  { "name": "invalid" },
  { "name": "question" },
  { "name": "wontfix" }
]
```

## Related projects

[https://github.com/jasonbellamy/git-label](git-label)

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full license text.
