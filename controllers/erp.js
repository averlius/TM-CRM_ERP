var passport = require('passport'),
        _ = require('lodash'),
        fs = require('fs'),
        path = require('path'),
        async = require('async');


var angular = {
    resources: [],
    controllers: []
};

exports.install = function () {


    loadFilesAngular(function (err, data) {
        if (err)
            return console.log(err);

        if (data)
            angular = data;
    });

    F.route('/erp/', view_erp, ['authorize']);
    F.route('/erp/', view_redirect, ['unauthorize']);
    F.websocket('/erp/', websocket, ['json']);
};

function view_redirect() {
    this.redirect('/login');
}

function loadFilesAngular(callback) {
    async.parallel({
        resources: function (cb) {
            var dir = __dirname + '/../app/resources';
            fs.stat(dir, function (err, stats) {
                if (err)
                    return cb(err);

                cb(null, fs.readdirSync(dir).filter(function (file) {
                    if (path.extname(file) === '.js')
                        return true;
                    return false;
                })
                        );
            });
        },
        controllers: function (cb) {
            var dir = __dirname + '/../app/controllers';
            fs.stat(dir, function (err, stats) {
                if (err)
                    return cb(err);

                cb(null, fs.readdirSync(dir).filter(function (file) {
                    if (path.extname(file) === '.js')
                        return true;
                    return false;
                })
                        );
            });
        }
    }, callback);
}

function view_erp() {
    var self = this;
    //console.log(self.host());
    //console.log(self.session);
    self.theme(null);
    self.view('angular', angular);
}

function websocket() {
    var UserModel = MODEL('user').Schema;
    var self = this;
    var usersId = {};
    //console.log("Connect Websocket");

    // refresh online users
    var refresh = function () {

        var usersList = [];
        self.all(function (client) {
            if (client.alias) {
                usersId[client.alias] = client.id;
                usersList.push(client.alias);
            }
        });
        UserModel.find({_id: {$in: usersList}}, "username firstname lastname photo poste societe", function (err, users) {
            self.send({type: 'users', message: users, online: self.online});
            //console.log("Connected: ", users);

            F.global.USERS = users; // User connected
        });
    };
    self.on('open', function (client) {
        console.log('Connect / Online:', self.online);
    });
    self.on('message', function (client, message) {

        if (message.type === 'change') {
            client.alias = message.message;
            refresh();
            return;
        }

        self.send({user: client.alias, type: 'message', message: message.message, date: new Date()}, function (current) {
            return (current.alias || '').length > 0;
        });
    });
    self.on('close', function (client) {
        console.log('Disconnect : ' + client.alias);
        refresh();
    });
    F.functions.EE.on('task', function (data) {
        //console.log(data);
        //console.log("task");
        self.send({type: 'task', message: data});
    });
    F.functions.EE.on('notify', function (notify) {
        //console.log(notify);
        self.send({type: 'notify', message: notify.data, users: notify.users, date: new Date()});
        /*var diff = _.difference(notify.users, F.global.USERS);
         
         if (diff.length) {
         //send email if needed notification
         console.log("Send email to ", diff);
         
         var mail = require('total.js/mail');
         var message = new mail.Message('Scan coupon', 'Scan coupon ');
         
         mail.on('error', function (err, message) {
         console.log(err);
         });
         
         mail.on('success', function(message) { console.log("Really sended!") });
         
         // Set email sender
         message.from('no-reply@logicielentreprise.com', 'Notification de LE&CO');
         
         message.to('herve.prot@leandco.fr');
         
         message.send(CONFIG('mail.smtp'), CONFIG('mail.smtp.options'), function () {
         console.log("sended");
         });
         
         }*/

    });
    F.functions.EE.on('symeosnet', function (data) {
        self.send({type: 'symeosnet', message: data.data});
    });
}
