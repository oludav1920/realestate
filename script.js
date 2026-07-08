con.query("CREATE TABLE IF NOT EXISTS lead_map(id INT AUTO_INCREAMENT PRIMARY KEY, first_name VARCHAR(250), last_name VARCHAR(250), email VARCHAR(250), phone_number, password, address, agency_name, license_number, years_experience, specialization, personal_bio, license, government_id, image, status)", (err,res)=>{
    if(err){
        console.log(err.message);
    }
    console.log("table created")
})