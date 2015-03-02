exports.haproxy = {
  filter : function(msg){
    return msg.indexOf('[HAPROXY]') !== -1;
  }
};
