const Parse = require('parse');
const crypto = require('crypto');
const { createRemoteFileNode } = require('gatsby-source-filesystem');

const getImageExtension = (value = '') =>
  ['jpeg', 'jpg', 'png', 'webp'].filter(extension => {
    return value.indexOf(extension) > -1;
  })[0];

const isBucketImage = (value = '') =>
  typeof value === 'string' &&
  value.indexOf('firebasestorage') > -1 &&
  getImageExtension(value);

const getDigest = id =>
  crypto
    .createHash('md5')
    .update(id)
    .digest('hex');

const transformPropertyOnMatch = (source, isMatch, transform) => {
  if (!source || source === null)
    return new Promise(resolve => {
      resolve();
    });

  return Promise.all(
    Object.keys(source).map(
      key =>
        new Promise(async (resolve, reject) => {
          try {
            // eslint-disable-next-line
            if (isMatch(source[key])) {
              source = await transform(source, key, source[key]);
            } else if (typeof source[key] === 'object') {
              await transformPropertyOnMatch(source[key], isMatch, transform);
            }
            resolve(source);
          } catch (e) {
            console.log(e);
          }
        })
    )
  );
};

const createImageNodes = async (
  node,
  { createNode, store, cache, createNodeId, createParentChildLink }
) => {
  await transformPropertyOnMatch(
    node,
    isBucketImage,
    (source, key, value) =>
      new Promise(async (resolve, reject) => {
        try {
          const ext = getImageExtension(value);
          const nameparts = value.replace(/%2F/g, '_').split('/');
          const name = nameparts[nameparts.length - 1]
            .split('?')[0]
            .replace(ext, `.${ext}`);

          // For all image nodes that have a featured image url, call createRemoteFileNode
          let fileNode = await createRemoteFileNode({
            url: value, // string that points to the URL of the image
            parentNodeId: node.id, // id of the parent node of the fileNode you are going to create
            createNode, // helper function in gatsby-node to generate the node
            createNodeId, // helper function in gatsby-node to generate the node id
            cache, // Gatsby's cache
            store, // Gatsby's redux store
            name,
          });

          if (fileNode) {
            fileNode.ext = ext;
            fileNode.extension = ext;
            fileNode.internal.mediaType = `image/${ext}`;

            source[key.concat('___NODE')] = fileNode.id; // Creates foreign key
            delete source[key]; // Prevents resolve duplicity errors

            // source[key] = fileNode
          }
          resolve(source);
        } catch (e) {
          reject(e);
        }
      })
  );
};

exports.sourceNodes = async (
  { boundActionCreators, createNodeId, store, cache },
  { types = [], parseConfig, useBucketImagesSharp },
  callback
) => {
  try {
    const { appId, serverURL, jsKey } = parseConfig;

    if (serverURL) Parse.serverURL = serverURL;
    Parse.initialize(appId, jsKey);

    const { createNode, createParentChildLink } = boundActionCreators;

    for (let i = 0; i < types.length; i++) {
      const entry = types[i];
      if (entry) {
        const { type = '', map = node => node } = entry;
        const Model = Parse.Object.extend(type);
        const query = new Parse.Query(Model);
        const docs = await query.get();

        if (docs.length > 0) {
          for (let doc of docs) {
            const contentDigest = getDigest(doc.id);
            const values = { ...doc.toJSON() };

            const node = Object.assign(
              {
                id: doc.id,
                parent: null,
                children: [],
                internal: {
                  type,
                  contentDigest,
                },
              },
              map(values)
            );

            if (useBucketImagesSharp)
              await createImageNodes(node, {
                createNode,
                createNodeId,
                createParentChildLink,
                store,
                cache,
              });

            createNode(node);
          }
        } else {
          createNode(
            Object.assign({
              id: '0',
              parent: null,
              children: [],
              values: {},
              internal: {
                type,
                contentDigest: getDigest(`test-${collection}-${Date.now()}`),
              },
            })
          );
        }
      }
    }
  } catch (e) {
    console.log(e);
  } finally {
    callback();
  }
};

exports.createSchemaCustomization = ({ actions }, { types = [] }) => {
  const { createTypes } = actions;
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const { definition } = type;
    if (definition) createTypes(definition);
  }
};
