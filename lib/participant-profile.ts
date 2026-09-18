// Names stay on this device. These common associations suggest an avatar,
// not a person's gender; ambiguous and unfamiliar names use a neutral avatar.
const boyNames = new Set('mayank manush rahul rohit amit aman arjun aditya akash ankit anish ayush harsh karan kunal manish mohit nikhil pranav rahul raj rajat rishabh sachin saurabh shivam siddharth varun vikas vivek yash ojas john james michael david daniel'.split(' '));
const girlNames = new Set('muskan mitali aditi ojasvi ananya aisha ankita anjali bhavna divya ishita kavya kritika meera neha nisha pooja prachi priya radhika ria riya sakshi sanjana shreya sneha tanvi vaishnavi vidhi mary sarah emma sophia'.split(' '));

export function firstName(name: string) {
 return name.match(/[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*/u)?.[0] ?? name.trim();
}

export function suggestedAvatar(name: string) {
 const first = firstName(name).toLocaleLowerCase();
 return boyNames.has(first) ? '👦🏻' : girlNames.has(first) ? '🙎🏻‍♀️' : '🧑🏻';
}
