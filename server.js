//importing 
import express from "express";
import mongoose from 'mongoose';
import Messages from './dbMessages.js'
import Pusher from "pusher";
import cors from 'cors';
//app config
const app = express();
const port = process.env.PORT || 9000



const pusher = new Pusher({
    appId: "1226397",
    key: "14546d3e89b118e3d998",
    secret: "1066a25693fcbde024ff",
    cluster: "mt1",
    useTLS: true
});

pusher.trigger("my-channel", "my-event", {
    message: "hello world"
});


// middleware
app.use(express.json());
app.use(cors())
app.use((req, res, next) => {
    res.setHeader('Allow-Control-Allow-Origin', '*')
    res.setHeader('Allow-Control-Allow-Header', '*')
    next();
})

//DB config
const connection_url = 'mongodb+srv://Vaishnav-Whatsapp:whatsapp123@cluster0.q2oob.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection
db.once('open', () => {
    console.log('DB connected');

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change)
        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            })
        }
        else {
            console.log('error triggering pusher')
        }
    });
})

//????

//api route
app.get('/', (req, res) => res.status(200).send('Hello world'));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})


app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
            console.log(err)
        } else {

            res.status(201).send(data)

        }
    })
})

//listen
app.listen(port, () => console.log(`Listening on localhost:${port}`))
