# app/controllers/users_controller.rb
class UsersController < ApplicationController
  before_action :authenticate_request

  def update_profile
    if current_user.update(user_params)
      render json: { message: "Profile updated successfully" }, status: :ok
    else
      render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    # Skip blank values to avoid overwriting existing ones
    params.require(:user).permit(:name, :email, :password).delete_if { |_, v| v.blank? }
  end
  
end
