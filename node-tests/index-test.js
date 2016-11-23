/* jshint node: true */
'use strict';

const AddonIndex = require('../index');
const expect = require('chai').expect;
const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
const fs = require('fs-extra');
const path = require('path');
const temp = require('temp');

describe('AddonIndex', function() {
  describe('included', function() {
    describe('in addon', function() {
      beforeEach(function() {
        let fakeApp = {
          project: {
            root: '/',
            pkg: {
              'ember-addon': true
            }
          }
        };

        AddonIndex.included(fakeApp);
      });

      it('sets blogDirectory to the dummy path', function() {
        let { blogDirectory } = AddonIndex;
        expect(blogDirectory).to.equal('/tests/dummy/blog');
      });
    });

    describe('in normal project', function() {
      beforeEach(function() {
        let fakeApp = {
          project: {
            root: '/',
            pkg: {}
          }
        };

        AddonIndex.included(fakeApp);
      });

      it('sets blogDirectory to the root path', function() {
        let { blogDirectory } = AddonIndex;
        expect(blogDirectory).to.equal('/blog');
      });
    });
  });

  describe('config', function() {
    it('sets addonConfig', function() {
      expect(AddonIndex.addonConfig).to.be.null;

      AddonIndex.config();

      expect(AddonIndex.addonConfig).to.not.be.empty;
    });

    it('returns the config to be merged into the main config', function() {
      let result = AddonIndex.config();
      expect(result.emberWriter).to.not.be.empty;
    });
  });

  describe('postBuild', function() {
    let tempDir;
    let blogPath;
    this.timeout(1000);

    beforeEach(function() {
      let tmproot = path.resolve(__dirname, '../tmp');
      // tempDir = fs.mkdtempSync(`${tmproot}${path.sep}`);
      tempDir = temp.mkdirSync('post-build');
      blogPath = path.join(tempDir, 'api', 'blog');
      fs.mkdirsSync(blogPath);
    });

    describe('posts.json', function() {
      describe('in production', function() {
        beforeEach(function() {
          let fakeApp = {
            env: 'production',
            project: {
              root: '/',
              pkg: {}
            }
          };

          let fakeMarkdownParser = {
            parsedPosts: [
              {
                attributes: {
                  author: 'dave',
                  title: 'Draft Post',
                  published: false
                }
              },
              {
                attributes: {
                  author: 'dave',
                  title: 'Published Post'
                }
              }
            ],
            parsedAuthors: [
              {
                slug: 'dave',
                attributes: {
                  name: 'Dave'
                }
              }
            ]
          };

          AddonIndex.app = fakeApp;
          AddonIndex.blogDirectory = tempDir;
          AddonIndex.markdownParser = fakeMarkdownParser;
          AddonIndex.postBuild({
            directory: tempDir
          });
        });

        it('does not include draft articles', function() {
          let articles = fs.readJSONSync(`${blogPath}/posts.json`);
          let draftArticle = articles.data.find((a) => a.attributes.title === 'Draft Post');

          expect(draftArticle).to.be.undefined;
        });
      });

      describe('in development', function() {
        beforeEach(function() {
          let fakeApp = {
            env: 'development',
            project: {
              root: '/',
              pkg: {}
            }
          };

          let fakeMarkdownParser = {
            parsedPosts: [
              {
                attributes: {
                  author: 'dave',
                  title: 'Draft Post',
                  published: false
                }
              },
              {
                attributes: {
                  author: 'dave',
                  title: 'Published Post'
                }
              },
            ],
            parsedAuthors: [
              {
                slug: 'dave',
                attributes: {
                  name: 'Dave'
                }
              }
            ]
          };

          AddonIndex.app = fakeApp;
          AddonIndex.blogDirectory = tempDir;
          AddonIndex.markdownParser = fakeMarkdownParser;
          AddonIndex.postBuild({
            directory: tempDir
          });
        });

        it('includes draft articles', function() {
          let articles = fs.readJSONSync(`${blogPath}/posts.json`);
          let draftArticle = articles.data.find((a) => a.attributes.title === 'Draft Post');

          expect(draftArticle).to.be.ok;
        });
      });
    });

    describe('tags.json', function() {
      beforeEach(function() {
        let fakeApp = {
          env: 'development',
          project: {
            root: '/',
            pkg: {}
          }
        };

        let fakeMarkdownParser = {
          parsedPosts: [
            {
              attributes: {
                author: 'dave',
                tags: 'ember, testing'
              }
            },
            {
              attributes: {
                author: 'dave',
                tags: 'testing,cycling'
              }
            }
          ],
          parsedAuthors: [
            {
              slug: 'dave',
              attributes: {
                name: 'Dave'
              }
            }
          ]
        };

        AddonIndex.app = fakeApp;
        AddonIndex.blogDirectory = tempDir;
        AddonIndex.markdownParser = fakeMarkdownParser;
        AddonIndex.postBuild({
          directory: tempDir
        });
      });

      it('creates tags with post counts', function() {
        let tags = fs.readJSONSync(`${blogPath}/tags.json`);
        let tagNames = tags.data.map((t) => t.attributes.name);
        let emberTag = tags.data.find((t) => t.attributes.name === 'ember');
        let testingTag = tags.data.find((t) => t.attributes.name === 'testing');

        expect(tags.data).to.have.length(3);
        expect(tagNames).to.contain('ember', 'testing', 'cycling');
        expect(emberTag.attributes.postCount).to.equal(1);
        expect(testingTag.attributes.postCount).to.equal(2);
      });
    });

    describe('authors.json', function() {
      beforeEach(function() {
        let fakeApp = {
          env: 'development',
          project: {
            root: '/',
            pkg: {}
          }
        };

        let fakeMarkdownParser = {
          parsedPosts: [
            {
              attributes: {
                author: 'dave',
                tags: 'ember, testing'
              }
            },
            {
              attributes: {
                author: 'dave',
                tags: 'testing,cycling'
              }
            }
          ],
          parsedAuthors: [
            {
              slug: 'dave',              
              attributes: {
                name: 'Dave'
              }
            }
          ]
        };

        AddonIndex.app = fakeApp;
        AddonIndex.blogDirectory = tempDir;
        AddonIndex.markdownParser = fakeMarkdownParser;
        AddonIndex.postBuild({
          directory: tempDir
        });
      });

      it('creates authors with post counts', function() {
        let authors = fs.readJSONSync(`${blogPath}/authors.json`);
        let dave = authors.data.find((a) => a.attributes.name === 'Dave');

        expect(authors.data).to.have.length(1);
        expect(dave.attributes.postCount).to.equal(2);
      });
    });
  });
});
