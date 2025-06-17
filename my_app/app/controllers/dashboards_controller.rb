class DashboardController < ApplicationController
  before_action :authenticate_request

  def index
    role = current_user.role.name

    case role
    when "Admin"
      render json: { redirect: "dashboard/admin" }, status: :ok
    when "Seller"
      render json: { redirect: "dashboard/seller" }, status: :ok
    when "Buyer"
      render json: { redirect: "dashboard/buyer" }, status: :ok
    else
      render json: { error: "Unknown role" }, status: :unprocessable_entity
    end
  end

  def admin
    valid_status = %w[approved rejected pending]
    if params[:status].present? && !valid_status.include?(params[:status])
      render json: { error: "Invalid status provided" }, status: :unprocessable_entity
      return
    end

    @products =
      case params[:status]
      when "approved"
        Product.approved
      when "rejected"
        Product.rejected
      else
        Product.pending
      end

    render json: @products, status: :ok
  end

  def seller
    valid_status = %w[pending approved rejected]

    if params[:status].present? && !valid_status.include?(params[:status])
      render json: { error: "Invalid status" }, status: :unprocessable_entity
      return
    end

    @products = current_user.products.includes(buyer_requests: :buyer)

    if params[:status].present?
      @products = @products.where(admin_status: params[:status])
    end

    render json: @products.as_json(include: { buyer_requests: { include: :buyer } }), status: :ok
  end

  def buyer
    @products =
      case params[:status]
      when "accepted"
        current_user.buyer_requests.approved.includes(:product).map(&:product)
      when "rejected"
        current_user.buyer_requests.rejected.includes(:product).map(&:product)
      else
        requested_product_ids = current_user.buyer_requests.pluck(:product_id)
        Product.approved.where.not(id: requested_product_ids).left_joins(:buyer_requests)
      end

    render json: @products, status: :ok
  end
end
