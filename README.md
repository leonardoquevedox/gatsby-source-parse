# gatsby-source-parse

[![npm version](https://badge.fury.io/js/gatsby-source-parse.svg)](https://badge.fury.io/js/gatsby-source-parse)

Gatsby source plugin for building websites using
[Parse](https://parseplatform.org/)
as a data source

## Usage

1. Add `gatsby-source-parse` as a dependency by running using `npm` or `yarn`:

   ```sh
   npm i gatsby-source-parse
   # or
   yarn add gatsby-source-parse
   ```

2. Configure settings at `gatsby-config.js`, for example (**please note that parseConfig settings are only placeholder/dummy values**):

   ```js
   module.exports = {
     plugins: [
       {
         resolve: `gatsby-source-parse`,
         options: {
           parseConfig: {
             apiKey: 'api-key',
             appId: 'my-parse-app-id',
             jsKey: 'my-parse-app-js-key',
             serverURL: 'https://myserveraddress.com/parse',
           },
           types: [
             {
               type: `Book`,
               map: doc => ({
                 title: doc.title,
                 isbn: doc.isbn,
               }),
             },
             {
               type: `Author`,
               map: doc => ({
                 name: doc.name,
                 country: doc.country,
               }),
             },
           ],
         },
       },
     ],
   };
   ```

   Note that you will need to have `books` and `authors` in Parse matching
   this schema before Gatsby can query correctly.

3. Test GraphQL query:

   ```graphql
   {
     allBooks {
       edges {
         node {
           title
           isbn
           author {
             name
           }
         }
       }
     }
   }
   ```

## Configurations

| Key                | Description                                                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `appConfig`        | Parse credentials generated on parse server configuration.                                                                                   |
| `types`            | Array of types, which require the following keys (`type`, `collection`, `map`)                                                               |
| `types.type`       | The type of the collection, which will be used in GraphQL queries, e.g. when `type = Book`, the GraphQL types are named `book` and `allBook` |
| `types.collection` | The name of the collections in Parse. **Nested collections are not tested**                                                                  |
| `types.map`        | A function to map your data in Parse to Gatsby nodes, utilize the undocumented `___NODE` to link between nodes                               |

## Disclaimer

This project is created solely to suit our requirements, no maintenance or
warranty are provided. Feel free to send in pull requests.

## Acknowledgement

- [ryanflorence/gatsby-source-firebase](https://github.com/ryanflorence/gatsby-source-firebase)
