const express = require('express');
const { google } = require('googleapis');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

const OauthData = require('./credentials.json');

const Oauth2Client = new google.auth.OAuth2(
    OauthData.web.client_id,
    OauthData.web.client_secret,
    OauthData.web.redirect_uris[0]
);

const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile';
var authed = false;
var name, picture

app.get('/', (req, res) => {
    if(authed) {
        var oauth2 = google.oauth2({
            auth: Oauth2Client,
            version: 'v2'
        })
        oauth2.userinfo.get((err, res) => {
            if(err) throw err

            name = res.data.name;
            picture = res.data.picture;
            console.log(name, picture)
        })
        res.render('docs', {name, picture});
    }
    else {
        var url = Oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });
        console.log(url);
        res.render('index', {url});
    }
    
})

app.get('/google/callback', (req, res) => {
    const code = req.query.code
    if(code) {
        Oauth2Client.getToken(code, (err, tokens) => {
            if(err) {
                console.log("Error in authenticating user");
                console.log(err)
            }
            else {
                console.log("Successfully authenticated user");
                Oauth2Client.setCredentials(tokens)

                authed = true;
                res.redirect("/");
            }
        })
    }
})

app.listen(3000, () => {
    console.log('Server listening on port 3000');
})
