module.exports = function(router) {
    // Load helper functions
    var RestClient = require('node-rest-client').Client;

    var client = new RestClient();
    var client2 = new RestClient()
    var client3 = new RestClient()

    // ADD extra routing here if needed.
    // require('./start-page.js')(router)



    // CHANGE VERSION each time you create a new version
    const version = 'dev/1-13'
    const base_url = version + "/"
    const file_url = version + "/dev"

    // Load any certificate within "app/data/certificates" folder
    const db = []

    function addCommodity(data, list) {
      console.log("adding commodity")
      var newCommodity = {}
      for (var k in data) {
        var o = {}
        var name = ""
        console.log(k)
        if (data.hasOwnProperty(k)) {
          var name = k;

        }

        newCommodity[name] = data[k]
      }
      list.push(newCommodity)
    }

    // MIDDLEWARE: Called every time a page is rendered
    router.use(function(req, res, next) {
      // this makes sure a certificate is loaded
      // if (req.query.certificate && req.session.database != req.query.certificate) {
      //   req.session.database = req.query.certificate
      //   req.session.db = tools.getDB(req.query.certificate, db).data
      // }
      // // if the certificate is does not exist get one.
      // req.session.db = req.session.db || tools.getDB(req.session.data.database, db).data
      // req.session.data.is_multiple = req.session.db.is_multiple
      // req.session.data.certificate_code = req.session.db.certificate_code
      next()
    })

    // ** GET template **
    // router.get('/' + base_url + '*/anypage', function(req, res) {
    //   res.render(base_url + req.params[0] + '/anypage', {
    //     "query": req.query
    //   }, function(err, html) {
    //     if (err) {
    //       if (err.message.indexOf('template not found') !== -1) {
    //         return res.render(file_url + '/anypage', {
    //           "query": req.query
    //         });
    //       }
    //       throw err;
    //     }
    //     res.send(html);
    //   })
    // });

    // **** POST TEMPLATE ***
    // router.post('/'+base_url+'*/clone', function(req, res) {
    //     res.redirect(301, '/' + base_url +req.params[0]+'/another page');
    // })
    //
    //
    // router.get('/poc/dev/index', function(req, res) {
    //   console.log("working")
    //   res.render('/poc/dev/index', {
    //     "query": req.query
    //   }, function(err, html) {
    //     if (err) {
    //       if (err.message.indexOf('template not found') !== -1) {
    //         return res.render('poc/dev/index', {
    //           "query": req.query
    //         });
    //       }
    //       throw err;
    //     }
    //     res.send(html);
    //   })
    // });
    function filterResults(r, q) {
      var list = []
      for (var i = 0; i < r.length; i++) {
        console.log("checking: " + r[i].lang)
        if (r[i].lang == 'en') {
          console.log('pushing ' + r[i].fullname.toUpperCase())
          list.push(r[i])
        }
        if ((r[i].fullname.toUpperCase() == q.toUpperCase()) && r[i].lang == "en") {
          list = []
          list.push(r[i])
          console.log('found match ' + r[i].fullname.toUpperCase())
          console.log('returning the one result')
          return list

        }
      }
      console.log('returning the full list')
      return list
    }

    function hasDuplicates(array, value) {
      console.log("hasDuplicate " + value)
      for (var i = 0; i < array.length; ++i) {
        if (array[i].eppocode == value) {
          return true;
        }
      }
      return false;
    }

    function getSpecies(code) {
      var rcl = new RestClient();
      return rcl.get("https://data.eppo.int/api/rest/1.0/taxon/" + code + "/taxonomy?authtoken=33b6eb122ffb617bd80ff8f33e191e3c", function(taxdata, response) {}).then(taxdata => {
        return taxdata
      })
    }

    async function populateResults2(d){
      client.get("https://data.eppo.int/api/rest/1.0/tools/search?kw=" + q + "&searchfor=1&searchmode=3&typeorg=1&authtoken=33b6eb122ffb617bd80ff8f33e191e3c", function(data, response) {
      var list = []
        for (const item of d) {
          if (!hasDuplicates(list, item.eppocode)) {
            // if its latin then we can add.
            console.log("language is " + item.lang)
            if (item.lang == "la") {
              list.push(item)
            } else if (item.lang == "en") {
              var rcl = new RestClient();
              rcl.get("https://data.eppo.int/api/rest/1.0/taxon/" + item.eppocode + "/taxonomy?authtoken=33b6eb122ffb617bd80ff8f33e191e3c", function(taxdata, response) {
                console.log("found taxom for "+item.eppocode)
              })
            }

          }
        }
      })
    }
    async function populateResults(d) {
      console.log("populateResults START -----")

      var list = []
      for (const item of d) {
        if (!hasDuplicates(list, item.eppocode)) {
          // if its latin then we can add.
          console.log("language is " + item.lang)
          if (item.lang == "la") {
            list.push(item)
          } else if (item.lang == "en") {
            var bar = new Promise((resolve, reject) => {
              var rcl = new RestClient();
              rcl.get("https://data.eppo.int/api/rest/1.0/taxon/" + code + "/taxonomy?authtoken=33b6eb122ffb617bd80ff8f33e191e3c", function(taxdata, response) {

                for (var j = 0; j < taxom.length; j++) {
                  if (taxdata[j][7] && !hasDuplicates(taxdata[j][7].eppocode)) {
                    taxdata[j][7].genus = taxdata[j][6]
                    taxdata[j][7].fullname = taxdata[j][7].prefname
                    list.add(taxdata[j][7])
                  }

                }
                resolve()
              })
            });

            bar.then(() => {
              console.log('All done!');
            });
          }
        }
      }
        console.log("populateResults END -----")
        return list
      }




      router.get('/' + base_url + '*' + 'application/create/plant-lookup2', function(req, res) {
        var q = req.query.keyword || "Rosa";
        var eppocode
        var results
        // First get any code for the search
        client.get("https://data.eppo.int/api/rest/1.0/tools/search?kw=" + q + "&searchfor=1&searchmode=3&typeorg=1&authtoken=33b6eb122ffb617bd80ff8f33e191e3c", function(data, response) {
          // parsed response body as js object

          plants = populateResults2(data)
          console.log("------- plants output ------ ")
          console.log(plants)
          console.log("------- end plats output ------ ")
          res.render(base_url + req.params[0] + 'application/create/plant-lookup', {
            "query": req.query,
            "db": plants,
          })
        })



      });

      // **** POST TEMPLATE ***
      router.post('/' + base_url + '*/application/create/commodity-page*', function(req, res) {
        var page = req.query.return_url || '/' + base_url + req.params[0] + '/application/create/commodity-list'
        addCommodity(req.body, req.session.data.commodities)
        res.redirect(301, page);
      })


      // *******************************
      // Global page GET router
      // *******************************

      // this adds query to all pages and will be used if no other get routing exists to override this.
      router.get('/' + base_url + '*', function(req, res) {
        console.log("default get routing page for: " + base_url + req.params[0])
        var dir = req.params[0].split(/\/+/g);
        // Remove the main folder from URL
        dir.shift()
        var baseDir = ""
        dir.forEach(function(element) {
          var path = "/" + element
          baseDir += path

        })
        // Attempt to render a page in the current folder
        res.render(base_url + req.params[0], {
          "query": req.query,
        }, function(err, html) {
          // If the page doesnt exist in current folder, attempt to render a page from the "core folder"
          // This reduces space of duplicating the whole folder
          if (err) {
            if (err.message.indexOf('template not found') !== -1) {
              console.log("No page in directory.attempting to load from core")
              return res.render(file_url + baseDir, {
                "query": req.query,
                // and more data to push to every page
              });
            }
            throw err;
          }
          res.send(html);
        });
      })

    }
