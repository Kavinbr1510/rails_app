class RegistrationsController < ApplicationController
  def new
    @user = User.new
    @roles = Role.where(name: [ "Seller", "Buyer" ])
  end

  def create
    role = Role.find_by(id: params[:user][:role_id])
    @user = User.new(user_params)
    @user.role = role

    if @user.save
      sign_in @user
      redirect_to dashboard_path
    else
      flash[:error] = "Signup failed"
      render :new
    end
  end

  private

  def user_params
    params.require(:user).permit(:email, :password, :name)
  end
end
