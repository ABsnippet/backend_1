class ApiError extends Error{
    constructor(
        statusCode,
        message="Smthng Went Wrong",
        errors = [],
        stack = ""
    ){
         super(message)
         this.statusCode = statusCode;
         this.data = null;//doc
         this.message = message
         this.success = false
         this.errors = errors

         if (stack) {
            this.stack = stack
         } else {
            Error.captureStackTrace(this,this.constructor)

         }
    }
}


export default ApiError;