 /////////////////////////////////////////////////////////
/////////// Contact Us sending message ///////////////////
//////////////////////////////////////////////////////////
let btn = document.getElementById("submit");
let who = document.getElementById("who");
let mail = document.getElementById("mail");
let msg = document.getElementById("message");
let errMsg = document.querySelector(".contactErrorMessage");
let NEInputs = document.querySelectorAll(".notEmptyInput");
let successMsg = document.querySelector(".contactSuccessMessage");
let emailErrMsg = "Make sure your mail includes @, and a domain! Like @gmail.com";
let successMessage = "Message send succesfully!";

NEInputs.forEach( (inp) => {
    inp.addEventListener('keydown', (event) => {
        if (event.srcElement.value+event.key){
            if (event.srcElement?.id == "mail" && 
            (!event.srcElement["value"].includes("@") || !event.srcElement["value"].includes("."))){
                errMsg.textContent = emailErrMsg;
                return;
            }
            event.srcElement.classList.remove('wrongInput');
            errMsg.textContent = "";
        } 
    });
});

btn.addEventListener('click', () => {

    // TODO: weryfikacja danych :D

    

    /// Check if values are not empty
    if (!who.value){
        who.classList.add("wrongInput");
        errMsg.textContent = "Please fill the From input field";
        return;
    }
    if (!mail.value){
        mail.classList.add("wrongInput");
        errMsg.textContent = "Please fill the Email adress";
        return;
    }
    if (!msg.value){
        msg.classList.add("wrongInput");
        errMsg.textContent = "You can't send an empty message!";
        return;
    }

    // Check if email has @ in it
    if (!mail["value"].includes("@") || !mail["value"].includes(".")){
        mail.classList.add("wrongInput");
        errMsg.textContent = emailErrMsg;
        return;
    }
    
    btn.textContent = "Sending..."

    fetch('https://holdupnevus.vercel.app/sendContactMessage', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "who": who.value, "mail": mail.value, "message": msg.value})
    })
    .then(response => {
        if (response.status == 200){
            successMsg.textContent = successMessage;
            setTimeout(() => successMsg.textContent = "", 5000)
        }else{
            errMsg.textContent = "Message was NOT sent, an error occured!";
            setTimeout(() => errMsg.textContent = "", 5000)
        }
        who.value = "";
        mail.value = "";
        msg.value = "";
        btn.textContent = "SEND"
    })
})

/////////////////////////////////////////////////////////
///////////////// Fade in on scroll /////////////////////
//////////////////////////////////////////////////////////

const observerFromRight = new IntersectionObserver((entries) => {
    entries.forEach( entry => {
        if (entry.isIntersecting){
            entry.target.classList.add("showFromRight");
        }else{
            entry.target.classList.remove("showFromRight");
        }
    });
});
let hideFromRights = document.querySelectorAll('.hideFromRight');
hideFromRights.forEach( el => { observerFromRight.observe(el)});

//////////////////////////////////////////////////////////

const observerFromLeft = new IntersectionObserver((entries) => {
    entries.forEach( entry => {
        if (entry.isIntersecting){
            entry.target.classList.add("showFromLeft");
        }else{
            entry.target.classList.remove("showFromLeft");
        }
    });
});
let hideFromLeft = document.querySelectorAll('.hideFromLeft');
hideFromLeft.forEach( el => { observerFromLeft.observe(el)});


//////////////////////////////////////////////////////////

const observerFadeIn = new IntersectionObserver((entries) => {
    entries.forEach( entry => {
        if (entry.isIntersecting){
            entry.target.classList.add("showFadeIn");
        }else{
            entry.target.classList.remove("showFadeIn");
        }
    });
});
let hideFadeIn = document.querySelectorAll('.hideFadeIn');
hideFadeIn.forEach( el => { observerFadeIn.observe(el)});


// Smooth title fade in for 1st time
setTimeout( () => {
    hideFadeIn.forEach( el => el.classList.remove("hide"))
}, 700);


///////////////////////////////////////////////////////

// Smooth background fade in for 1st time
let hideDarkIn = document.querySelectorAll('.hideDarkIn');
hideDarkIn.forEach( el => el.classList.add("showDarkIn"))

       