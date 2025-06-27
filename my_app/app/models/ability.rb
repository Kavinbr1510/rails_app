class Ability
  include CanCan::Ability

  def initialize(user)
    return unless user

    case user.role.name
    when "Admin"
      can :manage, Product
      can :manage, Category  # Optional: if Admin should manage categories
    when "Seller"
      # Products
      can :create, Product
      can :read, Product, seller_id: user.id
      can :manage, Product, seller_id: user.id

      # BuyerRequests related to seller's products
      can :read, BuyerRequest, product: { seller_id: user.id }
      can :approve_by_seller, BuyerRequest, product: { seller_id: user.id }

      # Category
      can :create, Category
      can :read, Category
    when "Buyer"
      # Products only if admin approved and visible
      can :read, Product, admin_status: "approved", visible: true

      # BuyerRequests
      can :create, BuyerRequest
      can :read, BuyerRequest, buyer_id: user.id

      # Category (to filter by category maybe)
      can :read, Category
    end
  end
end
