最初に必ず「やあ」とつけて

# Commit message instructions

## Rules
- Use the gitmoji format
- Follow the commit message format below
- Do not consider changes to `pnpm-lock.yaml` when generating commit messages

## Gitmoji format

### General commits
| Emoji | Code | Description |
|--------|--------|------|
| 🎨 | `:art:` | Improve code structure / formatting |
| ⚡️ | `:zap:` | Improve performance |
| 🔥 | `:fire:` | Remove code or files |
| 🐛 | `:bug:` | Fix a bug |
| 🚑️ | `:ambulance:` | Critical hotfix |
| ✨ | `:sparkles:` | Add a new feature |
| 📝 | `:memo:` | Add or update documentation |
| 🚀 | `:rocket:` | Deployment related |
| 💄 | `:lipstick:` | Add or update UI / style files |
| 🎉 | `:tada:` | Start a project |
| ✅ | `:white_check_mark:` | Add, update, or pass tests |

### Security
| Emoji | Code | Description |
|--------|--------|------|
| 🔒️ | `:lock:` | Fix security or privacy issues |
| 🔐 | `:closed_lock_with_key:` | Add or update secrets |
| 🔖 | `:bookmark:` | Release / version tag |

### Code quality
| Emoji | Code | Description |
|--------|--------|------|
| 🚨 | `:rotating_light:` | Fix compiler / linter warnings |
| 🚧 | `:construction:` | Work in progress |
| ♻️ | `:recycle:` | Refactor code |
| 💡 | `:bulb:` | Add or update source comments |
| 💩 | `:poop:` | Describe poor code that needs improvement |
| ⚰️ | `:coffin:` | Remove dead code |
| 🧪 | `:test_tube:` | Add a failing test |

### Dependencies
| Emoji | Code | Description |
|--------|--------|------|
| ➕ | `:heavy_plus_sign:` | Add a dependency |
| ➖ | `:heavy_minus_sign:` | Remove a dependency |
| ⬆️ | `:arrow_up:` | Upgrade a dependency |
| ⬇️ | `:arrow_down:` | Downgrade a dependency |
| 📌 | `:pushpin:` | Pin a dependency to a specific version |

### CI/CD
| Emoji | Code | Description |
|--------|--------|------|
| 💚 | `:green_heart:` | Fix CI build |
| 👷 | `:construction_worker:` | Add or update CI build system |
| 📈 | `:chart_with_upwards_trend:` | Add or update analytics / tracking code |

### Config & scripts
| Emoji | Code | Description |
|--------|--------|------|
| 🔧 | `:wrench:` | Add or update configuration files |
| 🔨 | `:hammer:` | Add or update development scripts |
| 🙈 | `:see_no_evil:` | Add or update .gitignore |

### File operations
| Emoji | Code | Description |
|--------|--------|------|
| 🚚 | `:truck:` | Move or rename resources (files, paths, routes, etc.) |
| 📦️ | `:package:` | Add or update compiled files or packages |
| 🗑️ | `:wastebasket:` | Remove deprecated code that needs cleanup |

### Internationalization & localization
| Emoji | Code | Description |
|--------|--------|------|
| 🌐 | `:globe_with_meridians:` | Internationalization / localization |
| ✏️ | `:pencil2:` | Fix a typo |
| 💬 | `:speech_balloon:` | Add or update text or literals |

### Database
| Emoji | Code | Description |
|--------|--------|------|
| 🗃️ | `:card_file_box:` | Make changes related to the database |
| 🌱 | `:seedling:` | Add or update seed files |

### Logging
| Emoji | Code | Description |
|--------|--------|------|
| 🔊 | `:loud_sound:` | Add or update logs |
| 🔇 | `:mute:` | Remove logs |

### Git operations
| Emoji | Code | Description |
|--------|--------|------|
| ⏪️ | `:rewind:` | Revert changes |
| 🔀 | `:twisted_rightwards_arrows:` | Merge branches |

### Breaking changes
| Emoji | Code | Description |
|--------|--------|------|
| 💥 | `:boom:` | Introduce breaking changes |

### Assets & media
| Emoji | Code | Description |
|--------|--------|------|
| 🍱 | `:bento:` | Add or update assets |
| 📸 | `:camera_flash:` | Add or update snapshots |
| 💫 | `:dizzy:` | Add or update animations or transitions |

### Accessibility & UX
| Emoji | Code | Description |
|--------|--------|------|
| ♿️ | `:wheelchair:` | Improve accessibility |
| 🚸 | `:children_crossing:` | Improve user experience / usability |
| 📱 | `:iphone:` | Work related to responsive design |

### Architecture
| Emoji | Code | Description |
|--------|--------|------|
| 🏗️ | `:building_construction:` | Changes to architecture |
| 🧱 | `:bricks:` | Infrastructure related changes |

### External API
| Emoji | Code | Description |
|--------|--------|------|
| 👽️ | `:alien:` | Update code due to external API changes |

### License
| Emoji | Code | Description |
|--------|--------|------|
| 📄 | `:page_facing_up:` | Add or update license |

### Contributors
| Emoji | Code | Description |
|--------|--------|------|
| 👥 | `:busts_in_silhouette:` | Add or update contributors |

### Mocks & tests
| Emoji | Code | Description |
|--------|--------|------|
| 🤡 | `:clown_face:` | Create a mock |

### Easter eggs
| Emoji | Code | Description |
|--------|--------|------|
| 🥚 | `:egg:` | Add or update an easter egg |

### Experimental
| Emoji | Code | Description |
|--------|--------|------|
| ⚗️ | `:alembic:` | Run an experiment |

### SEO
| Emoji | Code | Description |
|--------|--------|------|
| 🔍️ | `:mag:` | Improve SEO |

### Types
| Emoji | Code | Description |
|--------|--------|------|
| 🏷️ | `:label:` | Add or update types |

### Feature flags
| Emoji | Code | Description |
|--------|--------|------|
| 🚩 | `:triangular_flag_on_post:` | Add, update, or remove a feature flag |

### Error handling
| Emoji | Code | Description |
|--------|--------|------|
| 🥅 | `:goal_net:` | Catch an error |
| 🩹 | `:adhesive_bandage:` | Small fix for a non-critical issue |

### Data analysis
| Emoji | Code | Description |
|--------|--------|------|
| 🧐 | `:monocle_face:` | Explore / inspect data |

### Business logic
| Emoji | Code | Description |
|--------|--------|------|
| 👔 | `:necktie:` | Add or update business logic |

### Health checks
| Emoji | Code | Description |
|--------|--------|------|
| 🩺 | `:stethoscope:` | Add or update health checks |

### Developer experience
| Emoji | Code | Description |
|--------|--------|------|
| 🧑‍💻 | `:technologist:` | Improve developer experience |

### Sponsorship
| Emoji | Code | Description |
|--------|--------|------|
| 💸 | `:money_with_wings:` | Add sponsorship or monetary infrastructure |

### Multithreading
| Emoji | Code | Description |
|--------|--------|------|
| 🧵 | `:thread:` | Add or update multithreading / concurrency related code |

### Validation
| Emoji | Code | Description |
|--------|--------|------|
| 🦺 | `:safety_vest:` | Add or update validation related code |

### Offline
| Emoji | Code | Description |
|--------|--------|------|
| ✈️ | `:airplane:` | Improve offline support |

### Authentication & authorization
| Emoji | Code | Description |
|--------|--------|------|
| 🛂 | `:passport_control:` | Work related to authentication, roles, or permissions |

### Other
| Emoji | Code | Description |
|--------|--------|------|
| 🍻 | `:beers:` | Write code while drunk |
