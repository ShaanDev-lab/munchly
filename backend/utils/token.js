import jwt from "jsonwebtoken"

const genToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured")
    }
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" })
    return token
}

export default genToken