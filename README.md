Errorscanner-projekti kesältä 2024 // Errorscanner project, summer 2024


Projektirakenne // Project structure
```
js_scan_all_servers_for_errors
├── index.html
├── vite.config.js
├── gitlab-ci.yml
└── src
    ├── App.vue
    ├── Errorscanner.vue
    ├── main.js
    ├── useErrorScanner.js
    ├── useSlackChannel.js
    ├── utils.js
    ├── app
    │   ├── server.js
    │   └── manageResultsHistory.js
    ├── assets
    │   ├── base.css
    │   └── main.css
    └── components
        ├── DiskSpaces.vue
        ├── ExpandableEntry.vue
        ├── LogExpandables.vue
        └── TabBar.vue
```
(English project desrciption can be found below)

Lyhyesti:

Tehtiin erään yrityksen sovellukselle errorscanner, eli nettisivu, johon sovelluksen errorlogit julkaistiin. Nettisivun toiminta kirjoitettiin JavaScriptillä, joka ajettiin Raspberry Pi 5 -tietokoneen Apache-palvelimella.

Tavoite:

Selkeästi ja tehokkaasti viestiä sovelluksen palvelimien lokien
lähettämistä ERROR-viesteistä. Tehdä työkalu, jolla työntekijät voivat
helposti tutkia errorin alkuperää ja ratkaista ongelmia nopeammin.

Tiivistelmä:

Errorscanner pyytää ensin kaikilta palvelimilta lokitietoja. Tämä tapahtuu siten, että palvelimien REST-serveriltä kutsutaan erästä Java-luokkaa, joka palauttaa kyseisen palvelimen viimeisimmät lokit. Sen jälkeen lokia ja
muuta informaatiota käsitellään ja olennaiset tiedot tulostetaan
nettisivulle, jota ylläpitää Apache-palvelin.

Sivun lisäksi errorscanner lähettää joka aamu viestin työpaikan
Slack-kanavalle (useSlackChannel.js), missä kerrotaan sen hetken tilanne
ja muistutetaan levyillä jäljellä olevasta tilasta.
Viesti lähetetään myös, jos johonkin tutkittavista palvelimista ei saada yhteyttä.

Jotta erroreita voi tutkia myöhemminkin, sivulla olevat tiedot
tallennetaan kerran tunnissa Raspberry Pi:n paikalliselle kovalevylle.
manageResultsHistory.js sisältää koodin, jonka perusteella objektin
"results" sen hetkinen arvo tallennetaan .json-tiedostona.
Myöhemmin vanhoille sivuille pääsee antamalla URL-linkkiin parametreiksi
kyseisen päivän, kuukauden ja tunnin, jolloin tallennus tehtiin.

Tallentamista varten tarvitaan Node.js Express-palvelin.
Cross-origin resource sharing (eli CORS-) ongelmien välttämiseksi
konfiguroidaan Apachelle Proxy, joka ohjaa /api-alkuiset http-pyynnöt
Express-palvelimelle.

Nettisivun sisältö: (havainnollistettu [videoilla](https://drive.google.com/drive/folders/1oTw_3iCWZg13tscG4zs6MoMWgIEE78ZJ?usp=drive_link))

Jokaiselle lokiriville, joka kertoo errorista, on oma nappi. Nappia
painamalla elementti laajenee ja paljastaa lokitekstiä 50 riviä ennen ja
jälkeen tätä erroria. Lisäksi, jos toisessa lokissa on tapahtunut
jotakin samaan aikaan, se kootaan kohtaan "In another log:".
Errornappien alareunassa on myös luku, joka kertoo, kuinka monta
samanlaista erroria on tapahtunut viimeisessä 20 000 rivissä kyseistä
lokia. (20 000 siksi, että REST-serveriltä saadaan aina vain 20 000
viimeisintä riviä kerrallaan.) Tällöin se error, jonka viesti ja kellonaika
näkyy sivulla, on samanlaisista virheviesteistä viimeisin.

Slack-viesteissä jaetaan käyttäjille linkkejä, jotka ohjaavat tietyn
palvelimen sivulle, hyödyntäen URL-hashejä. Linkin perään siis lisätään
vain #palvelimen_nimi ja sivu avautuu suoraan kyseisen palvelimen
tietoihin, nopeuttaen käyttöä.

________________________________________________________________________________________________________

In short:

Programmed an errorscanner web tool with JavaScript for a company. The errorscanner gathers errors from the company's servers to a website which was hosted on a Raspberry Pi 5 -computer with an Apache server.

Objective:

To communicate about the errors effectively and in a clear way. To create a tool to easily inspect where the error came from and to help solve issues more quickly.

The app in a nutshell:

First, the errorscanner gets log records from all the servers. In order to do that, it sends a request to a REST-server. The REST-server contains a Java class that returns the latest log lines on that specific server. This is done to all the servers that need to be scanned for errors. After that the log and other data is processed and the program extracts essential information to print on to the website. The website is hosted on an Apache server.

In addition to the website the errorscanner sends a message every morning to the office Slack channel (useSlackChannel.js). In that message it sums up the current status of the servers and informs of the current available disk space. A message is sent also in case one of the servers is out of reach.

In order to inspect the errors later on, the site saves the data on top of the hour to the Raspberry Pi's hard drive. The file manageResultsHistory.js contains the code, which saves the current information on the site as a .json file. The user can access past errors by setting parameters for day, month and hour at the end of the URL.

The save feature requires a Node.js Express server. When a user wants to access old information, and sets parameters to the URL, the Express server gets a request and sends the wanted .json file as a response. To avoid cross-origin resource sharing (aka CORS) problems the Apache server was configured to forward any requests that start with /api to the Express server.

The contents of the website: (demonstrated on the [video](https://drive.google.com/drive/folders/1oTw_3iCWZg13tscG4zs6MoMWgIEE78ZJ?usp=drive_link))

Every error line of the log has its own button. When the button is pressed the element expands and reveals 50 lines of the log before and after the error happened. Also if there are log entries at the same time in another log file of the server, that information is gathered up under the title "In another log:". On the bottom of the button there is a number that represents the amount of times that specific error has occurred in the last 20 000 lines of log. (20 000 because the REST server returns only the last 20 000 lines of the log on every run.) This means that the error that is printed on the website is the most recent one of the duplicates.

The Slack messages contain links, that lead the user to a specific tab/server on the site. This feature was made using URL hashs; the link has #server_name at the end of the URL. This simplifies the use of the tool.
