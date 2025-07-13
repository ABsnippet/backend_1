class ApiError extends Error{
    constructor(
        statusCode,
        message="Smthng Went Wrong",
        errors = [],
        statck = ""
    ){
         super(message)
         this.statusCode = statusCode;
         this.data = null;//doc
         this.message = message
         this.success = false
         this.errors = errors

         if (statck) {
            this.stack = statck
         } else {
            Error.captureStackTrace(this,this.constructor)

         }
    }
}


export default ApiError;