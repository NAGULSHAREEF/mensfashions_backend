import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js"


function convertGoogleDriveLink(driveLink) {
    // Check if it's a Google Drive link
    if (driveLink.includes('drive.google.com')) {
        // Extract the file ID
        let fileId = '';
        
        if (driveLink.includes('/file/d/')) {
            // Format: https://drive.google.com/file/d/FILE_ID/view
            fileId = driveLink.split('/file/d/')[1].split('/')[0];
        } else if (driveLink.includes('id=')) {
            // Format: https://drive.google.com/open?id=FILE_ID
            fileId = driveLink.split('id=')[1].split('&')[0];
        } else if (driveLink.includes('/folders/')) {
            // This is a folder link, not a direct file link
            return driveLink; // Can't convert folder links directly
        }
        
        if (fileId) {
            // Convert to direct download link
            return `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
    }
    
    // If not a Google Drive link or couldn't parse, return the original
    return driveLink;
}
// function for add product
const addProduct = async (req, res) => {
    try {

        const { 
            name, 
            description, 
            price, 
            category, 
            subCategory, 
            sizes,
            bestseller,
            useImageLinks, 
            imageLink1,
            imageLink2,
            imageLink3,
            imageLink4
        } = req.body

        let imagesUrl = []

        if (useImageLinks === 'true') {
            // Handle image links
            if (imageLink1) imagesUrl.push(convertGoogleDriveLink(imageLink1))
                if (imageLink2) imagesUrl.push(convertGoogleDriveLink(imageLink2))
                if (imageLink3) imagesUrl.push(convertGoogleDriveLink(imageLink3))
                if (imageLink4) imagesUrl.push(convertGoogleDriveLink(imageLink4))

            if (imagesUrl.length === 0) {
                return res.json({
                    success: false,
                    message: "At least one image link is required"
                })
            }
        } else {
            // Handle file uploads as before
            const image1 = req.files.image1 && req.files.image1[0]
            const image2 = req.files.image2 && req.files.image2[0]
            const image3 = req.files.image3 && req.files.image3[0]
            const image4 = req.files.image4 && req.files.image4[0]

            const images = [image1, image2, image3, image4].filter((item) => item !== undefined)

            if (images.length === 0) {
                return res.json({
                    success: false,
                    message: "At least one image is required"
                })
            }

            imagesUrl = await Promise.all(
                images.map(async (item) => {
                    let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                    return result.secure_url
                })
            )
        }

        const productData = {
            name,
            description,
            category,
            price: Number(price),
            subCategory,
            bestseller: bestseller === "true" ? true : false,
            sizes: JSON.parse(sizes),
            image: imagesUrl,
            date: Date.now()
        }

        console.log(productData);

        const product = new productModel(productData);
        await product.save()

        return res.json({
            success: true,
            message: "Product added successfully"
        })

    } catch (error) {
        console.log("Error in add product:", error.message)
        return res.json({
            success: false,
            message: "Error in adding product"
        })
    }
}

// function for list product
const listProducts = async (req, res) => {
    try {
        
        const products = await productModel.find({});
        res.json({success:true,products})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for removing product
const removeProduct = async (req, res) => {
    try {
        
        await productModel.findByIdAndDelete(req.body.id)
        res.json({success:true,message:"Product Removed"})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for single product info
const singleProduct = async (req, res) => {
    try {
        
        const { productId } = req.body
        const product = await productModel.findById(productId)
        res.json({success:true,product})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { listProducts, addProduct, removeProduct, singleProduct }