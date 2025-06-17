class Ability
  include CanCan::Ability

  def initialize(user)
    return unless user

    if user.role.name == "Admin"
      can :manage, Product
    elsif user.role.name == "Seller"
      can :create, Product
      can :read, Product, seller_id: user.id
      can :read, BuyerRequest, product: { seller_id: user.id }
      can :approve_by_seller, BuyerRequest, product: { seller_id: user.id }
    elsif user.role.name == "Buyer"
      can :read, Product, admin_status: "approved"
      can :create, BuyerRequest
      can :read, BuyerRequest, buyer_id: user.id
    end
  end
end
