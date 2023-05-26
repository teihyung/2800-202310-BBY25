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
* ```npm i Bcrypt```
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
* ```NODEMAILER_PW```

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
```

## 6. Credits

We want to extend our gratitude to the following services that played a significant part in the completion of this project:

-  [MealDB API](https://www.themealdb.com/api.php) for providing access to their extensive recipe database.
-  [OpenAI's GPT-3](https://openai.com/research/gpt-3/) for making the ChatGPT API available and empowering us to create a more dynamic and interactive user experience.
-  [Bootstrap](https://getbootstrap.com/) for their incredible UI framework that helped us create a clean and responsive design.
-  [Font Awesome](https://fontawesome.com/) for their vast collection of icons.
- [Google Fonts](https://fonts.google.com/) for enhancing our application's aesthetics with their wide variety of fonts.

## 7. References

During our development process, we've taken inspiration and learned from many online resources. We would like to highlight the following:

-  [Mozilla Developer Network (MDN)](https://developer.mozilla.org/) - For providing comprehensive documentation on web technologies.
-  [Stack Overflow](https://stackoverflow.com/) - For being an invaluable community-driven resource for all our programming queries.
-  [W3Schools](https://www.w3schools.com/) - For their straightforward and easy-to-follow tutorials on a variety of web development topics.
-  [Node.js](https://nodejs.org) - For their official website and comprehensive documentation which greatly assisted our understanding of Node.js.
-  [OpenAI (ChatGPT)](https://www.openai.com) - For providing detailed documentation and resources that aided our implementation of the ChatGPT API.
-  [Bootstrap](https://getbootstrap.com) - For their official website and extensive documentation, which guided our utilization of this responsive front-end framework.
-  [MongoDB](https://www.mongodb.com) - For their official website and detailed documentation, enabling our effective use of this NoSQL database.
-  [GitHub](https://github.com) - For being a reliable and user-friendly platform for version control and collaborative software development.
-  [Studio3T](https://studio3t.com) - For their official website and resources that assisted our management of MongoDB databases.


## 8. License
©KitchenGenie 2022-2023

## 9. References 
- Node.js: Official website and documentation - https://nodejs.org

- ChatGPT by OpenAI: OpenAI website and documentation - https://www.openai.com

- Bootstrap: Official website and documentation - https://getbootstrap.com

- MongoDB: Official website and documentation - https://www.mongodb.com

- GitHub: Official website and documentation - https://github.com

- Studio3T: Official website and documentation - https://studio3t.com 

- Spoonacular API - https://spoonacular.com/food-api/docs


## 10. Big help from AI

AI was utilized during the development of our app in several ways:

- Code Generation: We employed AI-based code generation techniques to automate the process of writing code snippets. This involved training machine learning models on a large dataset of code examples, which allowed us to generate code snippets based on specific requirements or patterns.

- Troubleshooting and Debugging: AI was employed to assist in troubleshooting and debugging issues within the application. By leveraging machine learning algorithms, we developed an intelligent system that could analyze error logs, stack traces, and runtime behavior to identify potential issues and suggest possible solutions.

- Reference: We also utilized AI as a reference tool, leveraging its capabilities to gather ideas and insights. By harnessing natural language processing (NLP) techniques, we could analyze vast amounts of code, documentation, and online resources to extract relevant information and generate suggestions that inspired our development process.

In summary, AI played a significant role in code generation, troubleshooting, and served as a valuable reference tool during the app development process. These AI-powered capabilities not only enhanced productivity but also facilitated faster development cycles and improved the overall quality of the application.

## 11. Contact Information
- Bingdididi (zhoubingdica@gmail.com)
- YejuJ (jungyj320@gmail.com)
- 7374179 (7374179@gmail.com)
- teihyung (teihyung@gmail.com)


    
    
    


