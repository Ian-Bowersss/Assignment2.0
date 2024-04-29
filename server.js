// loads the products array from the .json file
const products = require(__dirname + '/products.json');
const express = require('express');
const app = express();

//const usersRegData = require(__dirname + '/user_data.json');
const fs = require('fs');

let userDataFile = __dirname + '/user_data.json';
const userData = require(userDataFile);

let userQuantities;

//check is user data file exist
let usersRegData = {};
if(fs.existsSync(userDataFile)){
  const data = fs.readFileSync(userDataFile, 'utf-8');
  usersRegData = JSON.parse(data);
  let stats = fs.statSync(userDataFile)
  console.log(`${userDataFile} has ${stats.size} characters stats.size`)
}
console.log(usersRegData)

// form data in a POST request 
const myParser = require("body-parser");
app.use(myParser.urlencoded({ extended: true }));

// Log requests to the console
app.all('*', function (request, response, next) {
  console.log(request.method + ' to ' + request.path);
  next();
});


app.post('/processLogin', function (req, res, next) {
  // Process login form POST and redirect to logged in page if ok, back to login page if not
  //res.json(request.body);
  console.log(req.body, req.query);
  // Process login form POST and redirect to invoice in page if ok, back to login page 
  const params = new URLSearchParams(req.query);
  params.append('email', req.body.email);
  const errors = {}; // assume no errors to start
  if (req.body.email in userData) {
    // check if the password is correct
    if (req.body.password == userData[req.body.email].password) {
      // password ok, send to invoice
      res.redirect('./invoice.html?' + params.toString());
      return;
    } else {
      errors.password = 'Password incorrect';
    }
  } else {
    errors.email = `user ${req.body.email} does not exist`;
  }
  // if errors, send back to login page to fix
  params.append('errors', JSON.stringify(errors));
  res.redirect('./login.html?' + params.toString());

});

//process registration form
app.post('/processRegister', function (req, res, next) {
  //process login from POST and redirect to invoice, if not back to login
  console.log(req.body, req.query);
  // Process registration form POST and redirect to invoice in page if ok, back to registraion page 
  const params = new URLSearchParams(req.query);
  params.append('email', req.body.email);
  const email = req.body.email;

  const errors = {}; // assume no errors to start

  // validate name
  if (!email.includes('@')) {
    errors.invalidEmail = "Please enter a valid email";
    console.log(errors);
  }
  
  // check if email is already taken
  
  if (userData.hasOwnProperty(email)) {
    errors.emailTaken = "Email is already taken";
    console.log(errors);
  }
  // check if passwords match
  if (req.body.psw !== req.body.confirmPsw) {
    errors.passwordMismatch = "Passwords do not match";
    console.log(errors);
  }

  // if errors, send back to registration page to fix otherwise send to invoice
  if (Object.keys(errors).length > 0) {
    params.append('errors', JSON.stringify(errors));
    res.redirect('./register.html?' + params.toString());
  } else {
    //Save register data
    let email = req.body.email;
    userData[email] = {};
    userData[email].password = req.body.psw;
    // write user_data JSON to file
    fs.writeFileSync(userDataFile, JSON.stringify(userData));

    // decrease inventory here ** move to when invoice is created **

    
    res.redirect('./invoice.html?' + params.toString());
  }

});

// javascript to define products array
app.get('/products.json', function (req, res, next) {
  res.json(products);
});


// if quantities are valid, otherwise redirect back to products
app.post('/process_purchase_form', function (req, res, next) {
  console.log(req.body)
  // process purchase form submitted
  const errors = {}; // assume no errors
  let quantities = [];
  if (typeof req.body['quantity_textbox'] != 'undefined') {
    quantities = req.body['quantity_textbox'];
    // Loop through the quantities submitted
    for (let i in quantities) {
      // validate the quantity inputted is a non-negative integer
      if (!isNonNegInt(quantities[i])) {
        errors['quantity' + i] = isNonNegInt(quantities[i], true).join('<br>');
      } else {
        const productsIdent = parseInt(i);
        const quantityReq = parseInt(quantities[i]);
        //validates that the quantity is less than or equal to the quantity available 
        if (!isNaN(productsIdent) && products[productsIdent] && products[productsIdent].quantityAvalible < quantityReq) {
          errors['quantity' + i] = 'Not enough available in inventory';
        }
      }

    }

    // Checks if the quantities array has at least one value greater than 0
    if (!quantities.some(qty => parseInt(qty) > 0)) {
      errors['quantity'] = 'Please select at least one item to purchase';
    }

    //Logs the purchase data to the console and where it came from. It is not required!!!
    console.log(Date.now() + ': Purchase made from ip ' + req.ip + ' data: ' + JSON.stringify(req.body));
  }

  // create a query string with data from the form
  const params = new URLSearchParams();
  params.append('quantities', JSON.stringify(quantities));
  // If there are errors, send user back to fix otherwise redirect to invoice with the quantities in the query string

  // If there are errors, send user back to fix otherwise send to invoice
  if (Object.keys(errors).length > 0) {
    // errors present , redirect back to store - fix and try again
    params.append('errors', JSON.stringify(errors));
    res.redirect('store.html?' + params.toString());
  } else {
    upInventory(quantities)
    //redirects to invoice
    res.redirect('./login.html?' + params.toString());
    //remove quantities from products.aval
    for (let i in products) {
      products[i].quantityAvalible -= request.body[`quantity_textbox${i}`];
    }
  }

});

app.use(express.static('./public'));
app.listen(8080, () => console.log(`listening on port 8080`));

// updates inventory
function upInventory(quantities) {
  for (let i in quantities) {
    const qty = parseInt(quantities[i]);
    if (!isNaN(qty) && qty > 0) {
      const productsIdent = parseInt(i);
      if (!isNaN(productsIdent) && products[productsIdent] && products[productsIdent].quantityAvalible >= qty) {
        products[productsIdent].quantityAvalible -= qty;
        // IR1 count the total quantity sold for the chosen product
        if (!products[productsIdent].total_sold) {
          products[productsIdent].total_sold = qty;
        } else {
          products[productsIdent].total_sold += qty;
        }
      }
    }
  }
}

function isNonNegInt(q, returnErrors = false) {
  errors = []; // assume no errors at first
  if (q == '') q = 0; // handle blank inputs as if they are 0
  if (Number(q) != q) errors.push('Not a number!'); // number value
  else {
    if (q < 0) errors.push('Negative value!'); //  non-negative
    if (parseInt(q) != q) errors.push('Not an integer!'); // integer
  }
  return returnErrors ? errors : (errors.length == 0);
}



// please just work lmao 







