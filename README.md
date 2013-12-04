
```
nginx.init({
  file : 'nginx-bckp.conf'
}, function() {
  nginx.addServer('192.123.23.21', function(err) {
    nginx.removeServer('192.123.23.22', function() {
    });
  });
});


```
