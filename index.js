const express =  require("express");
const app = express();
require('dotenv').config();
const mysql = require('mysql');
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static('Public'));
const multer = require('multer');
const bcrypt = require('bcrypt');

app.get("/",(req,res)=>{
    res.sendFile(__dirname+"/Public/index.html");
});

app.get("/reg",(req,res)=>{
    res.sendFile(__dirname+"/Public/agent-reg.html");
});

app.get("/adminreg",(req,res)=>{
    res.sendFile(__dirname+"/Public/admin-reg.html");
});

app.get("/clientreg",(req,res)=>{
    res.sendFile(__dirname+"/Public/client-reg.html");
});

app.get("/adminlogin",(req,res)=>{
    res.sendFile(__dirname+"/Public/admin-login.html");
});

app.get("/agentlogin",(req,res)=>{
    res.sendFile(__dirname+"/Public/agent-login.html");
});

app.get("/clientlogin",(req,res)=>{
    res.sendFile(__dirname+"/Public/client-login.html");
});

app.get("/dashboard",(req,res)=>{
    res.sendFile(__dirname+"/Public/dashboard.html");
});

app.get("/uploadproperty",(req,res)=>{
    res.sendFile(__dirname+"/Public/upload-property.html");
});

//database connection
 const con = mysql.createConnection({
        host: process.env.SERVER_HOST,
        user: process.env.SERVER_USER,
        password: process.env.SERVER_PASSWORD,
        database: process.env.SERVER_DATABASE
    });

 //set the storage function
const storageVar = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, './Public/uploadedFiles/');
    },
    filename: (req, file, cb)=>{
        cb(null, Date.now()+"_"+file.originalname);
    }
});

//set the fileFilter function
const fileFilterVar = (req, file, cb)=>{
    if(file.mimetype.startsWith('image/')){
        cb(null, true);
    }
    else{
        cb(new Error("only images allowed"),false);
    }
};

//set multer for uploading
const upload = multer({
    storage: storageVar,
    limits: {fileSize: 20*1024*1024},
    fileFilter: fileFilterVar
});

app.post('/regproccess', upload.fields([
    { name: 'license', maxCount: 1 },
    { name: 'government_id', maxCount: 1 },
    { name: 'profile_image', maxCount: 1 }
]), async(req, res) => {
    const {
        first_name, last_name, email, phone_number, password, 
        address, agency_name, license_number, years_experience, 
        specialization, personal_bio, status = 'pending'
    } = req.body;
    
    // Get file paths
    const licensePath = req.files['license'] ? req.files['license'][0].filename : '';
    const govIdPath = req.files['government_id'] ? req.files['government_id'][0].filename : '';
    const profileImagePath = req.files['profile_image'] ? req.files['profile_image'][0].filename : '';
    
    // Log for debugging
    console.log('Form Data:', req.body);
    console.log('Files:', req.files);
    console.log('License Path:', licensePath);
    console.log('Government ID Path:', govIdPath);
    console.log('Profile Image Path:', profileImagePath);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // INSERT DATA - Fix: 15 columns, 15 values
    const dataToInsert = [
        first_name, 
        last_name, 
        email, 
        phone_number, 
        hashedPassword, 
        address, 
        agency_name, 
        license_number, 
        years_experience, 
        specialization, 
        personal_bio, 
        licensePath,         
        govIdPath,          
        profileImagePath,   
        status              
    ];

    const qry = `INSERT INTO ${process.env.USERS_TABLE}(
        first_name, last_name, email, phone_number, password, 
        address, agency_name, license_number, years_experience, 
        specialization, personal_bio, license, government_id, image, status
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    
    con.query(qry, dataToInsert, (err, result) => {
        if(err){
            console.error('Database Error:', err.message);
            console.error('SQL Query:', qry);
            console.error('Data to Insert:', dataToInsert);
            return res.status(500).send('Error inserting data into database');
        }
        console.log('Registration successful, ID:', result.insertId);
        
    });
});

app.post('/agentloginprocess', (req,res)=>{
    //SELECT QUERY
const {email, password} = req.body;
    console.log(email,password);
    if(!email || !password){
        res.status(400).json();
    }
    else{
        
        const log =`SELECT * FROM ${process.env.USERS_TABLE} WHERE email=? AND password=?`;
        con.query(log, [email, password], (err, result)=>{
            if(err){
                console.log(err);
            }
            if(result.length > 0){
                console.log("success");
                return res.status(200).json(JSON.stringify(result[0]));
            }
            else{
                console.log('fail');
                return res.status(404).json();
            }
            console.log("login success");
            res.sendFile(__dirname+"/Public/upload-property.html");
        });
    }
});

app.post('/clientloginprocess', (req,res)=>{
    //SELECT QUERY
const {email, password} = req.body;
    console.log(email,password);
    if(!email || !password){
        res.status(400).json();
    }
    else{
        const log =`SELECT FROM root WHERE email=? AND password=?`;
        con.query(log, [email, password], (err,result)=>{
            if(err){
                console.log(err.message);
            }
            if(result.length > 0){
                return res.status(200).json(JSON.stringify(result[0]));
            }
            else{
                return res.status(400).json();
            }
            console.log("login success");
            res.sendFile(__dirname+"/Public/dashboard.html");
        });
    }
});

app.post('/adminregproccess', async(req,res)=>{
    const {fulname, email, phone_number, password} = req.body;

    const hashedPassword= await bcrypt.hash(password, 10);
    //INSERT DATA
    const dataToInsert = [fulname, email, phone_number, hashedPassword];
    const qry = `INSERT INTO ${process.env.ADMIN_TABLE}(fullname, email, phone_number, password) VALUES(?,?,?,?)`;
    con.query(qry, dataToInsert, (err,result)=>{
        if(err){
            console.log(err.message);
        }
        console.log('registration successful');

        //res.sendFile(__dirname+"/Public/regsuccess.html");
    });
});

app.post('/clientregproccess', async(req,res)=>{
    const {fullname, email, phone_number, address, password} = req.body;

    const hashedPassword= await bcrypt.hash(password, 10);
    //INSERT DATA
    const dataToInsert = [fullname, email, phone_number, address, hashedPassword];
    const qry = `INSERT INTO ${process.env.CLIENT_TABLE}(fullname, email, phone_number, address, password) VALUES(?,?,?,?,?)`;
    con.query(qry, dataToInsert, (err,result)=>{
        if(err){
            console.log(err.message);
        }
        console.log('registration successful');

        //res.sendFile(__dirname+"/Public/regsuccess.html");
    });
});

app.post('/uploadproccess', upload.single("image"),(req,res)=>{
    const {title, type, price, location, description, agent_id} = req.body;
    const saveImagePath = req.file.filename;
    console.log(req.file);

    //INSERT DATA
    const dataToInsert = [title, type, price, location, description, saveImagePath, agent_id];
    const qry = `INSERT INTO ${process.env.UPLOAD_TABLE}(title, type, price, location, description, image, agent_id) VALUES(?,?,?,?,?,?,?)`;
    con.query(qry, dataToInsert, (err,result)=>{
        if(err){
            console.log(err.message);
        }
        console.log('upload successful');
        //res.sendFile(__dirname+"/Public/index.html");
        window.location.href="/";
    });
});

app.post('/fetch-uploadprocess', (req, res)=>{
    try {
        const qry = `SELECT * FROM ${process.env.UPLOAD_TABLE}`;
        con.query(qry,(err, result)=>{
            if(err){
                console.log(err.message);
            }
            else{
                console.log(result);
                res.status(200).json(JSON.stringify(result));
            }
        })
    } catch (error) {
        console.log(error.message);
    }
});

app.post('/fetch-agent', (req, res)=>{
    try {
        const qry = `SELECT * FROM ${process.env.USERS_TABLE}`;
        con.query(qry,(err, result)=>{
            if(err){
                console.log(err.message);
            }
            else{
                console.log(result);
                res.status(200).json(JSON.stringify(result));
            }
        })
    } catch (error) {
        console.log(error.message);
    }
});

app.post('/fetch-client', (req, res)=>{
    try {
        const qry = `SELECT * FROM ${process.env.CLIENT_TABLE}`;
        con.query(qry,(err, result)=>{
            if(err){
                console.log(err.message);
            }
            else{
                console.log(result);
                res.status(200).json(JSON.stringify(result));
            }
        })
    } catch (error) {
        console.log(error.message);
    }
});

//SEND MAIL
app.post('/mailprocess', (req,res)=>{
    const {name, email, heading, message} = req.body;

    const transporter = nodemailer.createTransport({
    service: process.env.MAIL_PROVIDER,
    auth:{
        user: process.env.MAIL_FROM,
        pass: process.env.MAIL_PASSWORD
    }
    });

const emailoptions={
    from: email,
    to: process.env.MAIL_TO,
    subject: heading,
    text: message
    }

transporter.sendMail(emailoptions, (err,results)=>{
    if(err){
        console.log(err);
    }
    console.log('Email sent successfully')
});

    });

app.listen(process.env.PORT,()=>{
    console.log(`started at ${process.env.PORT}`);
});