Income expense flow

I want to build an responsive web app where I will add an expense or income will occur on specific date on the calender of the month. 

The UI will be simple like infinite vertical flow. If the user scroll it will loop each month and increment the year also.

UI is like a vertical timeline.

For example: It will be like Google Calender's Schedule view.

I can provide basic UI in asiic


Example, just rough example

10 Dec  ── CIBC CC        +$2,000
   │
21 Dec  ── Sent Money    -$100
   │
28 Dec  ── Income Pay    +$2,500



Main features:
1. User will be able to add income or expenses for the day of the month. Add from top left "+"
- User will add a label
- user will select if it is income or expense
- user will select the day of the month. (Just the day of the month, No year. Also no month like december or january.) Just the day of any month. No month or year.
- user can select if it will be repeat on same day every month, or repeat weekly or repeat biweekly.
2. User hovers over the day of the month. It will show the balance available or forecasted balance based on the calculation from previous entries(income and expense)
3. On Bottom right, you can show the Current balance based on the previous transactions(income and expenses) for the current day.



IMPORTANT: keep the design minimalist and clean and modern

Tech use Angular 18 with Signals, UI library - Angular Material

IMPORTANT: there will be no Backend at the moment and use localstorage at the moment for storage.

IMPORTANT: Try to use inbuilt or famous UI elements, but try avoid creating custom elements and css styles. Try to minimize custom css styles and custom elements.

IMPORTANT: Do not write any unit tests or any E2E tests or any tests. 

IMPORTANT: think for a nice project name


