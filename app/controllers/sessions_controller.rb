class SessionsController < ApplicationController
  def new
  end

  def create
    user = User.authenticate(params[:email], params[:password])

    if user
      sign_in(user)
      redirect_to dashboard_path, notice: "Signed in successfully."
    else
      flash.now[:alert] = "Invalid email or password."
      render :new
    end
  end

  def destroy
    sign_out
    redirect_to root_path, notice: "Signed out successfully."
  end
end
