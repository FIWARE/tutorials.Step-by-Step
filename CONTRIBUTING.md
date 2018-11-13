# How to contribute

Thank you for contributing to the FIWARE Step-by-Step Tutorials


## Testing

To test your changes run:

```console
npm install -C ./context-provider
npm test -C ./context-provider
```

This will check the text for obvious typos, informal grammar and dead links

## Submitting changes

Please send a [GitHub Pull Request](https://github.com/Fiware/tutorials.Step-by-Step/pull/new/master) 
with a clear list of what you've done (read more about [pull requests](http://help.github.com/pull-requests/)). 
Please follow our coding conventions (below) and make sure all of your commits are atomic (one feature per commit).

Always write a clear log message for your commits. One-line messages are fine for small changes, but bigger 
changes should look like this:

```
$ git commit -m "A brief summary of the commit
> 
> A paragraph describing what changed and its impact."
```

Separate Pull requests should be raised for code and documentation changes since code changes (including updates 
to `docker-compose` or `services`) require more in-depth testing, and text changes can be landed more quickly

## Coding conventions

The code and markdown files are formatted by [prettier](https://prettier.io), you can also run the formatter directly:

```console
npm run prettier -C ./context-provider
npm run prettier:text -C ./context-provider
```

Start reading our code and documentation and you'll get the hang of it:

-   Start with appropriate badges and an introductory paragraph
-   Create a **three level** ToC using markdown-toc 
-   No headings below `###`
-   Use 4th Level headings are **reserved** for `#### Request` and `#### Response` only
-   Every cUrl request should be numbered 
   -  Use emoji numbers in the `README.md` of each individual tutorial
   -  Use plain text numbers in `docs/*.md` used for the ReadtheDocs rendering
- Each tutorial follows a standard pattern - some sections are mandatory:
   -   *Architecture* - include a reference diagram
   -   *Prerequisites* (`README.md` only - remove from  `docs/*.md` )
   -   *Start Up*
- Where possible group API calls thematically, switching between two APIs doesn't help the flow of the learning material
- Use a formal writing style,  use direct verbs and avoid apostrophes, when in doubt follow 
  Chicago Manual of Style conventions.
- PRs do not need to update the Postman collection, this can be done after the code has landed

