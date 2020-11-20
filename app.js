const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(cors());

const OauthData = require('./credentials.json');

const Oauth2Client = new google.auth.OAuth2(
    OauthData.web.client_id,
    OauthData.web.client_secret,
    OauthData.web.redirect_uris[0]
);

const SCOPES = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/docs https://www.googleapis.com/auth/userinfo.profile';
var authed = false;
var name, picture, files, filePath;

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
        })
        const drive = google.drive({
            auth: Oauth2Client,
            version: 'v3'
        })

        drive.files.list({
            "q": "name contains '.docx'",
            "supportsAllDrives": true
        })
        .then((response) => {
            files = response.data.files
            console.log(files);
        })
        .then(() => {
            if(files.length) {
                res.render('docs', {name, picture, files,  filePath: null, success: false});
            }
            else {
                res.end('Error Loading Dashboard')
            }
        }).catch((err) => { console.error("Execute error", err); });
    }
    else {
        var url = Oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });
        res.render('index', {url});
    }  
})

app.get('/:doc', (req, res) => {
    var oauth2 = google.oauth2({
        auth: Oauth2Client,
        version: 'v2'
    })
    oauth2.userinfo.get((err, res) => {
        if(err) throw err

        name = res.data.name;
        picture = res.data.picture;
    })
    const drive = google.drive({
        auth: Oauth2Client,
        version: 'v2'
    })

    drive.files.get({
        fileId: req.params.doc
    })
    .then((res) => {
        filePath = 'https://view.officeapps.live.com/op/embed.aspx?src=' + res.data.webContentLink
        console.log(filePath)
    })
    .catch((err) => {console.log(err)})

    res.render('docs',{name, picture, files, filePath, success: true});
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
