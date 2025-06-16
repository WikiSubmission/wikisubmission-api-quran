# WikiSubmission Quran API

Access Quran: The Final Testament.

### Base URL

```
quran.wikisubmission.org
```

### Endpoints

- [x] /{query} (or /?q={query}) - detects and returns chapter, verse, verse-range, multiple-verses (comma separated), or text search result
- [x] /random-verse - returns a random verse
- [x] /random-chapter - returns a random chapter
- [x] /verse-of-the-day - returns today's daily verse (randomly generated)
- [x] /chapter-of-the-day - returns today's daily chapter (randomly generated)

### Optional parameters

- [x] sort_results (default: false)
- [x] normalize_god_casing (default: false)
- [x] include_word_by_word (default: false)
- [x] include_language (turkish | french | german | bahasa | persian | tamil | swedish | russian; default: none)
- [x] search_strategy (fuzzy | exact; default: fuzzy)
- [x] search_language (turkish | french | german | bahasa | persian | tamil | swedish | russian; default: english)
- [x] search_case_sensitive (default: false)
- [x] search_ignore_commentary (default: false)
- [x] search_apply_highlight (default: false)

### Status

Still in early stages; to be expanded.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for more information.

## Contact

Email: developer@wikisubmission.org