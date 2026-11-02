# UI checklist

<!-- Exercise 4 hands this in. Tick an item only when you have checked it, and replace
     the "how I checked" line with what you actually did. An unticked box is not a
     failure: it is a gap you then write into READINESS.md. A ticked box you cannot
     demonstrate at the defence is worse than an unticked one. -->

"Modern" is not a style. It is a short list of things a user notices when they are
missing: the screen tells you what is happening, you can get through it with a keyboard,
the text is readable, and nothing jumps around while it loads.

## Layout and typography

- [x] **One spacing scale and one type scale.** Sizes come from a small set of design tokens, not from numbers typed where they were needed.
  - how I checked: I added a spacing scale and a typography scale using CSS variables. I used these variables for the header, main content, event cards, and headings to keep the design consistent.
- [x] **Responsive at 380, 768 and 1280 pixels wide.** No horizontal scrollbar, no text running under another element.
  - how I checked:I tested the website at 380px, 768px, and 1280px using Safari Web Inspector. The event cards adjusted to different screen sizes, and I did not notice any horizontal overflow or overlapping text.
- [x] **Nothing jumps while the page loads.** Images and cards reserve their space before their content arrives.
  - how I checked:I refreshed the website in Safari and checked the layout while it was loading. The event cards and text stayed in their positions without any noticeable layout shifts.

## The four states, on every screen

A screen that only handles "it worked" is a screen that lies to the user on the day it matters.

- [x] **Loading.** Something tells the user the app is working, within about 100 ms.
  - how I checked: I refreshed the page and saw "Loading events..." before the event cards appeared. I also tested it with a temporary delay.
- [x] **Empty.** The screen says what this list is for and what to do next, instead of showing nothing.
  - how I checked: I tested the page with an empty events list and confirmed that the message "No upcoming events found." appeared instead of a blank screen.
- [x] **Error.** A sentence a person can read. Never a raw JSON body, never a stack trace, never just "Error".
  - how I checked:I tested the error state by using an invalid API endpoint. The request returned a 404 error, and the page displayed "Failed to load events." instead of showing a blank screen.
- - [x] **Success.**
  - how I checked: I registered for an event and saw a green success message. The registration count changed from 2/3 to 3/3, and the Register button changed to Event Full.

## Keyboard and accessibility

- [x] **The main flow works with the keyboard alone.** Sign in, do the core action, sign out, without touching the mouse.
  - how I checked: I tested the main buttons using only the keyboard. I used Tab to move between buttons and Enter to activate them. The keyboard navigation worked correctly.
- [x] **The focused element is visible.** A `:focus-visible` outline that is not switched off.
  - how I checked: I used the Tab key to navigate between buttons and confirmed that the focused button had a visible outline.
- [x] **Text contrast is at least 4.5:1.** Name the tool you measured with.
  - how I checked: I checked the CSS foreground and background colors using the WCAG contrast ratio formula. I also improved the red text and disabled button colors to make them easier to read.
- [x] **Every input has a label** a screen reader reads, not just placeholder text.
  - how I checked: I checked index.html for input, select, and textarea elements. There are no form fields that require labels. The current interface uses buttons for its main actions.
- [x] **The page has a correct `<title>` and `lang`.**
  - how I checked: I checked index.html and confirmed that the page has lang="en" and the title "Club Events - Dashboard". Both match the content of the website.
- [x] **Touch targets are at least 44 pixels.**
  - how I checked: I checked the CSS in index.html and confirmed that the Register, Sign in, and Sign out buttons have a minimum height and width of 44px.

## The model feature

- [x] **It shows that it is thinking.** A model call is slow and a free service may have been asleep; a frozen button is the worst possible answer.
  - how I checked: I clicked the Get AI Recommendations button and saw the "AI is thinking..." message. The button was disabled while the request was processing.
- [x] **It shows when it failed,** and the rest of the screen still works.
  - how I checked: I temporarily changed the API endpoint to test an error. The page showed "Could not load AI recommendations. Please try again." The event cards stayed visible, and the button was enabled again. I then restored the correct API endpoint.
- [x] **The user can tell the model's suggestion from a fact.** It is labelled as a suggestion, not presented as data the app knows.
  - how I checked: I received AI recommendations and confirmed that the page displayed "AI suggestions (not verified facts)". This makes it clear that the suggestions are not confirmed facts.


## Decisions

- [x] **Dark mode, or a written decision not to have one.**
  - what I decided and why: I decided to keep the light theme for this project. The interface is simple and easy to read, and I wanted to focus on the main features, accessibility, and responsive design instead of adding another theme.

## Evidence

<!-- Screenshots of at least the four states of one screen, and of the model feature
     thinking and failing. A link to them is enough; they do not have to be in the repo. -->
     - AI thinking state: [Screenshot](screenshots/ai-thinking.png)
     - AI success state: [Screenshot](screenshots/ai-success.png)
     - AI error state: [Screenshot](screenshots/ai-error.png)
     - Registration success: [Screenshot](screenshots/registration-success.png)
     - Events loading state: [Screenshot](screenshots/loading-state.png)
     - Events empty state: [Screenshot](screenshots/empty-state.png)
     - Events error state: [Screenshot](screenshots/error-state.png)