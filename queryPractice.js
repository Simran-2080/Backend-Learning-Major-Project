// # students
// # [
// #   { _id: 1, name: "Aman", age: 21, marks: 85, skills: ["JS", "React"] },
// #   { _id: 2, name: "Sim", age: 22, marks: 45, skills: ["C++", "DSA"] },
// #   { _id: 3, name: "Raj", age: 19, marks: 70, skills: ["JS", "Node"] },
// #   { _id: 4, name: "Neha", age: 22, marks: 90, skills: ["React", "Node"] }
// # ]

// # Level 1 — Basic syntax
// # 1.Find students whose age is greater than 20.
students.aggregate([
    {
        $match :{
            age : {$gt : 20}
        }
    }
])

// # 2.Find students whose marks are greater than or equal to 70.
students.aggregate([
    {
        $match:{
            marks : {$gte : 70}
        }
    }
])

// # 3.Find students whose age is exactly 22 using $eq.
students.aggregate([
    {
        $match:{
            age : {$eq : 22}
        }
    }
])

// # 4.Find students whose marks are less than 60.
students.aggregate([
    {
        $match: {
            marks: {$lt : 60}
        }
    }
])

// # 5.Find students whose age is either 19 or 21.
students.aggregate([
    {
        $match:{
            age : {$in : [19, 21]}
        }
    }
])

// # 6.Return only name and marks. Exclude _id.
students.aggregate([
    {
        $project:{
            _id: 0,
            name: 1,
            marks: 1,
            age: 0,
            skills: 0  
        }
    }
])

// # 7.Find students whose name is not Aman.
students.aggregate([
    {
        $match:{
            name: { $ne : "aman"}  
        }    
    }
])

// # 8.Find students whose marks are between 70 and 90, inclusive.
students.aggregate([
    {
        $match:{ 
            marks : {$gte : 70, $lte: 90}
        }
    }
])

// # Level 2 — Combining operators
// # 9. Find students aged at least 21 whose marks are above 80.
students.aggregate([
    {
        $match:{
                age: {$gte : 21},
                marks: {$gte: 80}
        }
    }
])

// # 10. Find students who have either "React" or "Node" as their skill. (Hint: $in behaves differently when matching an array field.)
students.aggregate([
    {
        $match:{
            skills:{
                $in: ["React", "Node"]
            }
        }    
    }
])

// # 11. Add a field result that is "Pass" if marks are at least 50, otherwise "Fail". (Hint: $addFields + $cond.)
students.aggregate([
    {
        $addFields:{
            result:{
                $cond:{
                    if: {
                         $gte: ["$marks", 50]
                    },
                    then: "pass",
                    else: "fail"
                }
            }
        }
    }
])


// # 12. Add a field skillCount containing the number of skills each student has. (Hint: $size.)
students.aggregate([
    {
        $addFields:{
            skillCount:{
                $size : "$skills"
            }
        }
    }
])
// # 13. Return name, age, and a new field doubleMarks equal to twice the marks.
students.aggregate([
    {
        $addFields:{
            doubleMarks:{
                 $multiply : ["$mark", 2]} //No need to use map beacuse it is a single value
                }
    },
    {
    $project:{
        name: 1,
        age: 1,
        doubleMarks: 1
    }
}

])

// # 14. Add a field adult that is true when age is at least 21, otherwise false.
students.aggregate([
    {
        $addFields:{
            adult:{
                $cond:{
                    if: { $gte: ["$age", 21]},
                    then: true,
                    else: false
                }
            }
        }
    }
])

// # 15. Return only students with at least two skills, showing name and skillCount.
students.aggregate([
    {
        $addFields:{
            skillCount: {
                $size: "$skills"
            }
        }
    },
    { 
        $match:{
            skillCount : { $gte: 2}
        }
    },
    {
        $project:{
            name: 1,
            skillCount: 1
        }
    }
])
// # Level 3 — $map and expressions
// # 16. Use $map to transform each student's skills array into a new array containing each skill in lowercase. (Hint: $toLower.)
// # 17. Use $map to add 5 to every number in an array field named scores.
// # 18. Use $map on an array of objects named products, where each object contains price. Return an array of only the prices.

// # 16. Explain what "$skills" and "$$skill" mean in this expression:
// # {
// #   $map: {
// #     input: "$skills",
// #     as: "skill",
// #     in: "$$skill"
// #   }
// # }


// # 20. Use $filter to keep only marks greater than or equal to 70 from an array field named scores. (Hint: $filter selects elements; $map transforms them.)
// # Level 4 — $lookup and combined pipelines
// # Use these additional collections:
// # users:
// # [
// #   { _id: 1, username: "aman" },
// #   { _id: 2, username: "sim" }
// # ]


// # subscriptions:
// # [
// #   { subscriber: 1, channel: 2 },
// #   { subscriber: 2, channel: 1 },
// #   { subscriber: 3, channel: 2 }
// # ]


// # 21. Find all subscription documents where channel is 2.
// # 22. Use $lookup to attach subscriptions to each user by matching users._id with subscriptions.channel. Name the array subscribers.
// # 23. Add subscriberCount by counting the elements in subscribers.
// # 24. Add isSubscribed to check whether the currently logged-in user's ID exists among the subscriber IDs in subscribers. Use $map + $in + $cond.
// # 25. Write a complete pipeline that:
// # - Matches a user by username.
// # - Looks up their subscribers.
// # - Calculates subscriberCount.
// # - Calculates isSubscribed.
// # - Projects only username, subscriberCount, and isSubscribed.