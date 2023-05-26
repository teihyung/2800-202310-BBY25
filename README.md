# 2800-202310-BBY25

<div align="center">

# KitchenGenie

<img src="/img/KitchenGenie.jpg" alt="Kitchen Genie Logo" style="border-radius: 50%;" width="300" height="100">

</div>


## 1. Project Description
Our team, BBY25, is developing a web application that utilizes AI technology to simplify meal planning and preparation by suggesting recipes based on ingredients available at home.

## 2. Names of Contributors

* Bingdi Zhou -Hi there! I'm Bingdi, a Term 2 CST student at BCIT. My fascination with programming languages started with Java, leading me to establish a strong foundation in coding. For the KitchenGenie app, I implemented the AI Search Bar feature and exciting Easter eggs. But I'm not always immersed in code; I love the great outdoors and enjoy playing piano. I constantly seek new challenges and opportunities for growth in both worlds.

* Yeju Jung - Hello, I'm Yeju, a first-year CST student at BCIT with a focus on JavaScript and front-end development. I am passionate about       learning new programming languages, with python currently on top of my list. For the KitchenGenie project, I've successfully implemented the Random Recipe and Shopping List features. When I'm not buried in code, I find serenity in nature, particularly birdwatching and capturing the beauty of wildlife through my photography.

* Taehyuk Chung -Hey, I'm Taehyuk! As a Term 2 CST student at BCIT, I am deeply engrossed in the world of technology. For our KitchenGenie project, I have contributed by implementing the Bookmark and User Profile features. I'm also passionate about photography, often using drones to capture breathtaking aerial shots. Outside of coding and photography, you'll find me cycling or strumming my guitar.

* Tae Hyung Chung -Greetings, I'm Tae Hyung! Currently, I'm immersed in my Term 2 CST studies at BCIT, constantly expanding my tech knowledge. I brought the Log In, Log Out, and Filter features to life in our KitchenGenie app. Like my peers, I balance my love for technology with outdoor pursuits. My interests include drone photography, capturing stunning shots from above, and tennis.
	
## 3. Technologies and Resources Used

<p align="center" > 
JavaScript | HTML5 | CSS3 | NodeJS | MongoDB | Express | BootStrap | Git | 
<br>
<br>
<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=javascript,html,css,nodejs,mongodb,express,bootstrap,git " />
  </a>
</p>
</p>

For API's we have used:
* ChatGPT API
* Kaggle database

## 4. Complete setup/installion/usage/.env
Our application boasts a user-friendly and intuitive design, ensuring a seamless experience for our users. To get started: 

* Navigate to http://gkqlocmzys.eu09.qoddiapp.com/
* Click on the "Sign Up" button to create an account using your email.
* Once signed up, locate the search bar and enter one or more ingredients.
* Voila! You will be presented with a wide variety of recipes.
* Click on the name of a recipe to view the full ingredients and instructions.
* Don't forget to "favorite" any recipes you like to save them to your bookmark page or save your ingredients needed in your shopping list.
* Library installation
* In order to run our code in local machine, you have to download the following,
* ``` npm i Bcrypt```
* ``` npm i Connect-mongo ```
* ``` npm i Ejs ```
* ``` npm i Express ```
* ``` npm i Express-session ```
* ``` npm i Joi ```
* ``` npm i Nodemailer ```
* ``` npm i Openai ```
* ``` npm i Csv-parser ```
* ``` npm i Node/Nodemon ```
* Lastly, in order to run our code, you need to set up .env file inside that contains the following
* ``` OPENAI_API_KEY ```
* ``` MONGODB_HOST ```
* ``` MONGODB_USER```
* ``` MONGODB_PASSWORD ```
* ``` MONGODB_DATABASE ```
* ``` MONGODB_SESSION_SECRET ```
* ``` NODE_SESSION_SECRET ```
* ``` EMAILJS_USER ``` 
* ``` EMAILJS_HOST ```
* ``` NODEMAILER_PW```

## 5. file of content
Content of the project folder:

```
 Top level of project folder:               
├── .gitignore                  # Files to ignore when pushing
├── Procifile		        # require to run the web application on qoddi
├── README.md			# README			
├── databaseConnection.js	# connect to database
├── dataset.csv			
├── email.js			# send email
├── index.js	
├── node-chatgpt-api.js		# prototype for chatgpt api implementation on js
├── package.json
├── spinner.js
├── style.css
├── user.js			# find user on database
└── utils.js			# directory 

subfolders and files:
├── img
    ├── food			# inside the folder, there is estimate of 13,500 images. 
    Genie.gif			# easter egg gif
    background.jpg		
    chef-hat.png		# easter egg hat
    favicon.png			# logo
    logo_hat.png		# easter egg 
    spinner.gif			
    
├── view
    ├── templates
    	footer.ejs		
	header.ejs	
	searchBar.ejs		# searchbar 
	svg.ejs			# menu bar 
	user.ejs 		# make name visible in the members page
    404.ejs
    bookmarks.ejs		# bookmark display
    bookmarks_page.ejs		# see list of book mark user put
    change_password.ejs		# change password	
    createUser.ejs		# create user
    error.ejs			# error handling page
    filter.ejs			# filter function
    filteredRecommendation.ejs  # main page recommendation
    forgot-password.ejs		# send reset code to email
    index.ejs			# main page
    kitchenGenie.ejs		# Easter egg
    login.ejs			# login	
    logout.ejs			# logout
    main.ejs			# first page when user goes in to the link
    profile.ejs			# view profile
    random_recipe.ejs		# random recipe
    recipe.ejs			
    reset-password.ejs		# insert reset password code
    search.ejs			# display the result from the search bar and filter
    shopping-list.ejs		# shopping list save
    shoppingList.ejs		# display shopping list
## 6. Credits
* [MealDB API](https://www.themealdb.com/api.php)
* [GhatGPT API](https://developers.google.com/gmail/api)](https://platform.openai.com/docs/introduction)
* [Bootstrap](https://getbootstrap.com/)
* [Font Awesome](https://fontawesome.com/)
* [Google Fonts](https://fonts.google.com/)


    
    
    


