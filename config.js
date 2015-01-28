exports.haproxy = {
  path : '/vicanso/log/haproxy',
  filter : function(msg){
    return msg.indexOf('[HAPROXY]') !== -1;
  }
};