import logo from 'ic:canisters/logo';

logo.greet(window.prompt("Enter your name:")).then(greeting => {
  window.alert(greeting);
});
