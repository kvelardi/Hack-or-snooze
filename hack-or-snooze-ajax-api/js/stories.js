"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, deleteBtnHTML=false) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  /**if user is logged in, show favorite star */
  const showStar = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
        ${deleteBtnHTML ? deleteBtnHTML() : ""}
        ${showStar ? getStarHTML(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/**create the HTML delete button  */
function deleteBtnHTML(){
  return `
    <span class = "trash-can">
      <i class = "fas fa-trash"></i>
      </span>`
}

/**create HTML star for favorite */
function getStarHTML(story, user){
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? "fas" : "far";
  return `
    <span class = "star">
      <i class = "${starType} fa-star"></i>
    </span>`;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/**Delete a story */
async function deleteStory(evt){
  console.debug("deleteStory");

  const $closestLi = $(evt.target).closest("li");
  const storyId = $closestLi.attr("id");

  await storyList.removeStory(currentUser, storyId);
  //re-generate story list
  await putUserStoriesOnPage();
}

$ownStories.on("click", ".trash-can", deleteStory);

/** Handle submitting new story form. */

async function handleNewStorySubmit(evt){
  console.debug("handleNewStorySubmit");
  evt.preventDefault();

  const author = $("#author").val();
  const title = $("#title").val();
  const url = $("#url").val();
  const username = currentUser.username;
  const newStory = {author, title, url, username};

  const story = await storyList.addStory(currentUser, newStory);
  
  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);

  $submitForm.slideUp("slow");
  $submitForm.trigger("reset");
}

$submitForm.on("submit", handleNewStorySubmit);

/**********************User's own stories****************** */

function putUserStoriesOnPage(){
  console.debug("putUserStoriesOnPage");
  $ownStories.empty();

  if (currentUser.ownStories.length === 0){
    $ownStories.append("<h5>No stories added by user yet!</h5>");
  } else {
    for (let story of currentUser.ownStories){
      let $story = generateStoryMarkup(story, true);
      $ownStories.append($story);
    }
  }
  $ownStories.show();
}

/******************************Functions for favorites list**************************************/

/**Put Favorites List on page */
function putFavoritesListOnPage(){
  console.log("putFavoritesListOnPage");
  $favoritedStories.empty();

  if (currentUser.favorites.length === 0){
    $favoritedStories.append("<h5>No favorites added!</h5>");
  } else {
    for (let story of currentUser.favorites){
      const $story = generateStoryMarkup(story);
      $favoritedStories.append($story);
    }
  }
  $favoritedStories.show();
}

/**Handle favorite/unfavorite a story */
async function toggleStoryFavorite(evt){
  console.debug("toggleStoryFavorite");

  const $target = $(evt.target);
  const $closestLi = $target.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId);

  if ($target.hasClass("fas")){
    await currentUser.removeFavorite(story);
    $target.closest("i").toggleClass("fas far");
  } else {
    await currentUser.addFavorite(story);
    $target.closest("i").toggleClass("fas far");
  }
}
$storiesList.on("click", ".star", toggleStoryFavorite);
