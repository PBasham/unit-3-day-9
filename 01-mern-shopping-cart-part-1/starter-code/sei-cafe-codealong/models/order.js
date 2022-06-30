const mongoose = require("mongoose")
const Schema = mongoose.Schema
const { virtuals } = require("./itemSchema")
// Require the itemSchema below 
const itemSchema = require("./itemSchema")

const lineItemSchema = new Schema ({
    // Set qty to 1 when new item pushed into line items
    qty: { type: Number, default: 1 },
    item: itemSchema
}, {
    timestamps: true,
    toJSON: { virtuals: true }
})
// Add an extPrice to line item
lineItemSchema.virtual("extPrice").get(function() {
    // "this" is bound to the lineItem subdocument
    return ( this.qty * this.item.price)
})

const orderSchema = new Schema({
    // An order belongs to a user
    user: { type: Schema.Types.ObjectId, ref: "User" },
    // embed an order's line items is logical
    lineItems: [lineItemSchema],
    //  A user's unpaid order is their "cart"
    isPaid: { type: Boolean, default: false}
}, {
    timestamps: true,
    // Serialize the virtuals!
    toJSON: { virtuals: true }
})

// Add the following helpful virtuals to order documents
orderSchema.virtual('orderTotal').get(function () {
    return this.lineItems.reduce((total, item) => total + item.extPrice, 0);
  });
  
  orderSchema.virtual('totalQty').get(function () {
    return this.lineItems.reduce((total, item) => total + item.qty, 0);
  });
  
  orderSchema.virtual('orderId').get(function () {
    return this.id.slice(-6).toUpperCase();
  });

  // statics are callable on the mode, not an instance (document)
  orderSchema.statics.getCart = function(userId) {
    // "this" is bound to the model so don't use arrow functions
    // return the promise that resolves to a cart. (the user's unpaid order)
    return this.findOneAndUpdate(
        // query
        { user: userId, isPaid: false },
        // update - in the case order (cart) is upserted
        { user: userId },
        // upsert option created the doc if it doesn't exist!
        { upsert: true, new: true }
    )
  }

module.exports = mongoose.model("Order", orderSchema)