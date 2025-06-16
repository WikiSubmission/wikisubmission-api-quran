# WikiSubmission Quran API

Access Quran: The Final Testament.

### Base URL

```
quran.wikisubmission.org
```

### Endpoints

- [*] /{query} (or /?q={query}) - detects and returns chapter, verse, verse-range, multiple-verses (comma separated), or text search result
- [*] /random-verse - returns a random verse
- [*] /random-chapter - returns a random chapter
- [*] /verse-of-the-day - returns today's daily verse (randomly generated)
- [*] /chapter-of-the-day - returns today's daily chapter (randomly generated)

### Optional parameters

- [*] sort_results (default: false)
- [*] normalize_god_casing (default: false)
- [*] include_word_by_word (default: false)
- [*] include_language (turkish | french | german | bahasa | persian | tamil | swedish | russian; default: none)
- [*] search_strategy (fuzzy | exact; default: fuzzy)
- [*] search_language (turkish | french | german | bahasa | persian | tamil | swedish | russian; default: english)
- [*] search_case_sensitive (default: false)
- [*] search_ignore_commentary (default: false)
- [*] search_apply_highlight (default: false)

### Status

Still in early stages; to be expanded.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for more information.

## Contact

Email: developer@wikisubmission.org