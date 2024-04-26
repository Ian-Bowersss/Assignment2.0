



// get the query string into a easy to use object
const params = (new URL(document.location)).searchParams;
let errors = {};
let quantities = [];

// check if the query string has errors, if so parse it
if (params.has('errors')) {
  errors = JSON.parse(params.get('errors'));
  // get the quantities also to insert into the form to make sticky
  quantities = JSON.parse(params.get('quantities'));

}

// IR4 
function newPurchaseButton() {
  //declares variable to change the value of the Purchase button
  const purchaseButton = document.getElementById("PurchaseButton");
  // makes sure length of array is greater than 0 and makes sure array is present and that all elements are = 0
  if (quantities.length > 0 && quantities.every(qty => parseInt(qty) == 0)) {
    purchaseButton.value = "Please Select Some Items to Purchase";
    //if error occurs of a nonNegInt it will display this message inside the purchase button
  } else if (Object.keys(errors).length > 0) {
    purchaseButton.value = "Please fix the errors and try again";
  } else {
    purchaseButton.value = "Purchase!";
  }
}

let products;
window.onload = async function () {
  // use fetch to retrieve product data from the server
  // once the products have been successfully loaded and formatted as a JSON object
  // display the products on the page
  await fetch('products.json').then(await function (response) {
    if (response.ok) {
      response.json().then(function (json) {
        products = json;
        display_products();
        newPurchaseButton();
      });
    } else {
      console.log('Network request for products.json failed with response ' + response.status + ': ' + response.statusText);
    }
  });
}

// function to perform the filtering of the products
function myFunction() {
  var input, filter, ul, si, a, i, txtValue;
  input = document.getElementById("search_textbox");
  filter = input.value.toUpperCase();
  si = document.getElementsByTagName("section");
  for (i = 0; i < si.length; i++) {
    a = si[i].getElementsByTagName("h2")[0];
    txtValue = a.textContent || a.innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      si[i].style.display = "";
    } else {
      si[i].style.display = "none";
    }
  }
}


function display_products() {
  // loop through the products array and display each product as a section element
  for (let i = 0; i < products.length; i++) {
    let quantity_label = 'Quantity';
    // if there is an error with this quantity, put it in the label to display it
    if ((typeof errors['quantity' + i]) != 'undefined') {
      quantity_label = `<font class="error_message">${errors['quantity' + i]}</font>`;
    }
    let quantity = 0;
    // put previous quantity in textbox if it exists
    if ((typeof quantities[i]) != 'undefined') {
      quantity = quantities[i];
    }
    products_main_display.innerHTML += `
    <section class="item">
    <div style="text-align: center;">
    <h2 style=" ;">${products[i].name}</h2>
        <img src="./images/${products[i].image}" height="150px" width="150px"> 
    </div>
    <p>${products[i].quantityAvalible} shoes in stock</p>
    <p style="font-size: larger; font-weight: bold; text-align: center;">$${products[i].price}</p>
   
    <label>${quantity_label}</label>
   
    <input type="text" placeholder="0" name="quantity_textbox[${i}]" value="${quantity}">

    </section>
`;
  }
}