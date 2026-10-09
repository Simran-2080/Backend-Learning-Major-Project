//yeh class kya hai ? oi special class hai kiya..? nhi inheritence use huya hai
class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message) // yeh super kya hai -> inheritence ki property hai
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor)  //yeh smj nhi aaya
        }
    }
}

// basically poora code explain kro khud ko

export { ApiError }



