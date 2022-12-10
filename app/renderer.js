const {
    ipcRenderer
} = require('electron')

const axios = require('axios')

const register = exports.register = function register() {
    ipcRenderer.send('register')
}
const login = exports.login = function login() {
    ipcRenderer.send('login')
}

const sendRegisterRequest = exports.sendRegisterRequest = function sendRegisterRequest() {
    // making screen blury and showing loading animation
    let loading = document.getElementById('loading')
    // position absolute
    loading.style.position = 'absolute'
    loading.style.opacity = '0.8'
    loading.style.zIndex = '1'
    loading.style.pointerEvents = 'all'
    loading.style.transition = 'all 0.5s ease-in-out'
    // position fixed
    loading.style.position = 'fixed'
    loading.style.top = '0'
    loading.style.left = '0'
    loading.style.width = '100%'
    loading.style.height = '100%'
    loading.style.backgroundColor = 'rgba(0,0,0,0.5)'
    loading.style.display = 'flex'
    loading.style.justifyContent = 'center'
    loading.style.alignItems = 'center'

    // send request
    axios.post('http://localhost:5000/auth/reg', {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        email: document.getElementById('email').value
    }).then((res) => {
        console.log(res)
        alert(res.data.message).then(() => {
            ipcRenderer.send('login')
        }
        )
    }
    ).catch((err) => {
        console.log(err)
        alert(err.response.data.message)
    }
    ).finally(() => {
        loading.style.display = 'none'
        })
}

const sendLoginRequest = exports.sendLoginRequest = function sendLoginRequest() {
    // making screen blury and showing loading animation
    let loading = document.getElementById('loading')
    // position absolute
    loading.style.position = 'absolute'
    loading.style.opacity = '0.8'
    loading.style.zIndex = '1'
    loading.style.pointerEvents = 'all'
    loading.style.transition = 'all 0.5s ease-in-out'
    // position fixed
    loading.style.position = 'fixed'
    loading.style.top = '0'
    loading.style.left = '0'
    loading.style.width = '100%'
    loading.style.height = '100%'
    loading.style.backgroundColor = 'rgba(0,0,0,0.5)'
    loading.style.display = 'flex'
    loading.style.justifyContent = 'center'
    loading.style.alignItems = 'center'

    

    // send request
    axios.post('http://localhost:5000/auth/login', {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
    }).then((res) => {
        console.log(res)
        // send renderrer to main
        localStorage.setItem("refreshToken", res.data.tokens.refreshToken)
        localStorage.setItem("accessToken", res.data.tokens.accessToken)
        localStorage.setItem("user", JSON.stringify(res.data.user))
        console.log(localStorage.getItem("refreshToken"))
        console.log(localStorage.getItem("accessToken"))
        console.log(localStorage.getItem("user"))
        ipcRenderer.send('login-success', res.data.tokens.accessToken, res.data.tokens.refreshToken, res.data.user)
    }
    ).catch((err) => {
        console.log(err)
        alert(err.response.data.message)
    }
    ).finally(() => {
        loading.style.display = 'none'
    })
}

const loadLeftbar = exports.loadLeftbar = function loadLeftbar() {
    // get user data from local storage
    const axios = require('axios');
    const refreshToken = localStorage.getItem('refreshToken');
    // write refresh token to cookie
    document.cookie = `refreshToken=${refreshToken}`;

    
    // get access token from local storage
    const accessToken = localStorage.getItem('accessToken');
    // // get user id from local storage
    const userId = localStorage.getItem('userId');
    console.log(accessToken);
    console.log(userId);
    console.log(refreshToken);
    // send request to get user with access token in authorization header and user_id in url
    axios.get(`http://localhost:5000/user/?id=${userId}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    }).then(res => {
        // get user data
        const user = res.data;
        //  знак рубля 
        let rub = String.fromCharCode(8381);
        // set user data to html elements
        document.getElementById('username').innerText = user.username;
        document.getElementById('email').innerText = user.email;
        document.getElementById('balance').innerText = user.balance + rub;
    }).catch(err => {
        // if error, trying to refresh access token
        // get refresh token from local storage
        let refreshToken = localStorage.getItem('refreshToken');
        // send request to refresh access token
        axios.post(`http://localhost:5000/auth/refresh`, {
            refreshToken: refreshToken
        }).then(res => {
            // get new access token
            const newAccessToken = res.data.accessToken;
            console.log(res.data);
            // set new access token to local storage
            localStorage.setItem('accessToken', newAccessToken);
            // send request to get user with new access token in authorization header and user_id in url
            axios.get(`http://localhost:5000/user/?id=${userId}`, {
                headers: {
                    Authorization: `Bearer ${newAccessToken}`
                }
            }).then(res => {
                // get user data
                const user = res.data;
                // set user data to html elements
                document.getElementById('username').innerText = user.username;
                document.getElementById('email').innerText = user.email;
                document.getElementById('balance').innerText = user.balance;
            }).catch(err => {
                // if error, redirect to login page
                // window.location.href = 'login.html';
                console.log(err);
            });
        }).catch(err => {
            // if error, redirect to login page
            // window.location.href = 'login.html';
            console.log(err);
        });
    });
} 

const add = exports.add = function add(amount) {
    axios.post('http://localhost:5000/user/add', {
        amount: amount
    }, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
    }).then(res => {
        console.log(res);
        loadLeftbar();
    }
    ).catch(err => {
        console.log(err);
    }
    )
}

const download = exports.download = function download(name) {
    let url = `http://localhost:5000/files/${name}`;
    // get default download directory for os
    ipcRenderer.send("download", url);
    // on download complete
    ipcRenderer.on("downloaded", (event, arg) => {
        console.log("args",arg)
        let path = arg.filePath
        alert("Шаблон скачан в " + path);
    });
}


const uploadProgress = exports.uploadProgress = function uploadProgress(evt) {
    if (evt.lengthComputable) {
        var percentComplete = Math.round(evt.loaded * 100 / evt.total);
        document.getElementById('progressBar').style.width = percentComplete.toString() + '%';
    } else {
        document.getElementById('progressBar').innerHTML = 'unable to compute';
    }
}

const uploadComplete = exports.uploadComplete = function uploadComplete(evt) {
    /* This event is raised when the server send back a response */
    // alert(evt.target.responseText);2
    console.log(evt.target.responseText)
    let response = JSON.parse(evt.target.responseText)
    console.log(response) 
    // get label  with id file_name and replace it with response.file
    document.getElementById('fileName').innerHTML = response.filename
    // console.log(document.getElementById('formid').file.files[0])
    console.log(document.getElementById('fileName'))
    analyzeTable(response.filename)
}

const uploadFailed = exports.uploadFailed = function uploadFailed(evt) {
    alert("There was an error attempting to upload the file.");
}

const uploadCanceled = exports.uploadCanceled = function uploadCanceled(evt) {
    alert("The upload has been canceled by the user or the browser dropped the connection.");
}

const uploadFile = exports.uploadFile = function uploadFile() {
    var file = document.getElementById('uploadForm').file.files[0];
    var formData = new FormData();
    formData.append('file', file);
    var xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', uploadProgress, false);
    xhr.addEventListener('load', uploadComplete, false);
    xhr.addEventListener('error', uploadFailed, false);
    xhr.addEventListener('abort', uploadCanceled, false);
    // post request to upload file with access token in authorization header
    xhr.open('POST', 'http://localhost:5000/user/uploadTable', true);
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('accessToken')}`);
    xhr.send(formData);
}

const analyzeTable = exports.analyzeTable = function analyzeTable(fileName) {
    // send request to analyze table with access token in authorization header and file name in url
    axios.post(`http://localhost:5000/user/analyzeTable`, {
        filename: fileName
    }, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
    }).then(res => {
        console.log(res);
        let total = document.getElementById('total')
        let valid = document.getElementById('valid')
        let invalid = document.getElementById('invalid')
        let price = document.getElementById('price')
        let message = document.getElementById('message')
        let improve = document.getElementById('improve')
        let next = document.getElementById('next')

        total.innerText = "Всего: " + res.data.total
        valid.innerText = "Валидных: " + res.data.validNumbersCount
        invalid.innerText = "Невалидных: " + res.data.invalidNumbersCount
        price.innerText = "Стоимость исправления: " + res.data.cost + " руб."
        message.style.display = "block"
        improve.style.display = "block"
        next.style.display = "block"
        improve.onclick = function () {
            improveNumbers(fileName)
        }
        next.onclick = function (){
            addBase(res.data.validNumbers, fileName)
        }
    }
    ).catch(err => {
        console.log(err);
    }
    )
}

const improveNumbers = exports.improveNumbers = function improveNumbers(fileName) {
    let loader = document.getElementById('loading')
    loading.style.position = 'absolute'
    loading.style.opacity = '0.8'
    loading.style.zIndex = '1'
    loading.style.pointerEvents = 'all'
    loading.style.transition = 'all 0.5s ease-in-out'
    // position fixed
    loading.style.position = 'fixed'
    loading.style.top = '0'
    loading.style.left = '0'
    loading.style.width = '100%'
    loading.style.height = '100%'
    loading.style.backgroundColor = 'rgba(0,0,0,0.5)'
    loading.style.display = 'flex'
    loading.style.justifyContent = 'center'
    loading.style.alignItems = 'center'
    axios.get(`http://localhost:5000/user/improveTable?filename=${fileName}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
    }).then(res => {
        console.log(res);
        loading.style.display = 'none'
        alert("Номера исправлены, c вас списано " + res.data.endCost + " руб.")
        window.location.href = 'base.html'
    }
    ).catch(err => {
        console.log(err);
    }
    )
}

const addBase = exports.addBase = function addBase(numbers, fileName) {
    axios.post(`http://localhost:5000/user/addBase`, {
        arrayOfNumbers: numbers,
        filename: fileName
    }, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
    }).then(res => {
        console.log(res);
        alert("Номера добавлены в базу")
        window.location.href = 'base.html'
    }
    ).catch(err => {
        console.log(err);
    }
    )
}

const getBases = exports.getBases = function getBases() {
    axios.get(`http://localhost:5000/user/getBases`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
    }).then(res => {
        console.log(res);
        let bases = document.getElementById('bases')
        res.data.bases.forEach(base => {
            let div = document.createElement('div')
            div.className = 'base'
            // bootstrap card
            div.className += ' card'
            div.className += ' mb-3'
            div.className += ' p-3'
            div.className += ' bg-light'
            div.className += ' border'
            div.className += ' border-primary'
            div.className += ' rounded'
            div.className += ' shadow'
            let name = document.createElement('h3')
            name.innerText ="База - " + base.filename.split('.')[0]
            let date = document.createElement('p')
            let normalDate = new Date(base.date).toLocaleString()
            date.innerText ="Дата создания: "
            date.innerText += normalDate
            let count = document.createElement('p')
            count.innerText ="Размер: " + base.count
            div.appendChild(name)
            div.appendChild(date)
            div.appendChild(count)
            bases.appendChild(div)
            bases.className += ' p-2'
        })
    }
    ).catch(err => {
        console.log(err);
    }
    )
}

const loadPopupContent = exports.loadPopupContent = function loadPopupContent() {
    let baseSelect = document.getElementById('base')
    letbases = document.getElementById('bases')
    // get bases from server and create options
    axios.get(`http://localhost:5000/user/getBases`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
    }).then(res => {
        console.log(res);
        res.data.bases.forEach(base => {
            let option = document.createElement('option')
            option.value = base.filename.split('.')[0]
            option.innerText = base.filename.split('.')[0]
            baseSelect.appendChild(option)
        })
    }
    ).catch(err => {
        console.log(err);
    }
    )

}


const showPopup = exports.showPopup = function showPopup() {
    let popup = document.getElementById('popup')
    popup.style.display = 'flex'
}

const hidePopup = exports.hidePopup = function hidePopup() {
    let popup = document.getElementById('popup')
    popup.style.display = 'none'
}

const createDistribution = exports.createDistribution = function createDistribution() {
    let text = document.getElementById('text')
    text = text.value  
    console.log(text);
    if(text.length == 0) {
        return alert("Введите текст")
    }
    let base = document.getElementById('base').value
    let name = document.getElementById('name').value
    let loading = document.getElementById('loading')
    loading.style.position = 'absolute'
    loading.style.opacity = '0.8'
    loading.style.zIndex = '10000000'
    loading.style.pointerEvents = 'all'
    loading.style.transition = 'all 0.5s ease-in-out'
    // position fixed
    loading.style.position = 'fixed'
    loading.style.top = '0'
    loading.style.left = '0'
    loading.style.width = '100%'
    loading.style.height = '100%'
    loading.style.backgroundColor = 'rgba(0,0,0,0.5)'
    loading.style.display = 'flex'
    loading.style.justifyContent = 'center'
    loading.style.alignItems = 'center'
    axios.post(`http://localhost:5000/user/createDistribution`, {
        text: text,
        baseName: base,
        name: name
    }
        , { headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
    }).then(res => {
        console.log(res);
        loading.style.display = 'none'
        alert("Рассылка создана")
        window.location.href = 'sender.html'
    }
    ).catch(err => {
        console.log(err);
    }
    )
}

const loadDistributions = exports.loadDistributions = function loadDistributions() {
    let distributionTable = document.getElementById('distributions')
    // table has 5 columns 
    // 1 - name
    // 2 - date
    // 3 - status
    // 4 - count
    // 5 - sended
    axios.get(`http://localhost:5000/user/getDistributions`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
    }).then(res => {
        let distributions = res.data.distributions
        distributions.forEach(distribution => {
            let tr = document.createElement('tr')
            let name = document.createElement('td')
            name.innerText = distribution.name
            let date = document.createElement('td')
            let normalDate = new Date(distribution.date).toLocaleString()
            date.innerText = normalDate
            let status = document.createElement('td')
            switch(distribution.status) {
                case false:
                    status.innerText = 'Не завершена'
                    break
                case true:
                    status.innerText = 'Завершена'
                    break
            }
            let count = document.createElement('td')
            count.innerText = distribution.links[0]
            let sended = document.createElement('td')
            sended.innerText = distribution.cursor
            tr.appendChild(name)
            tr.appendChild(date)
            tr.appendChild(status)
            tr.appendChild(count)
            tr.appendChild(sended)
            distributionTable.appendChild(tr)
        }
        )
    }
    ).catch(err => {
        console.log(err);
    }
    )

}